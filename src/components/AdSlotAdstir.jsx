// src/components/AdSlotAdstir.jsx
import React, { useEffect, useRef } from "react";

/**
 * AdSlotAdstir（iframe + bootstrap-wait 版）
 *
 * 目的:
 * - adstir.js が document.write と window.adstir_vars を前提にしているため、
 *   SPA後挿入では順序競合が起きる（platform 未定義など）。
 * 解法:
 * - フレンドリー iframe を生成し、その中で
 *   1) config（/adstir_*_config.js）を先に読み込む
 *   2) window.adstir_vars が定義されたのを確認してから adstir.js を append
 *   するブートストラップを実行。
 *
 * 使い方:
 * - tagHtml には従来どおり
 *   `<script src="/adstir_sp_config.js"></script><script src="https://js.ad-stir.com/js/adstir.js"></script>`
 *   の 2 本が入っていればOK（順番は不問。本コンポーネントで正規化して待機します）
 *
 * 注意:
 * - ラッパー側で SP: w-[320px] min-w-[320px] min-h-[60px] / PC: w-[300px] min-w-[300px] min-h-[250px]
 *   を指定すること（iframe は 100% でフィット）
 */

export default function AdSlotAdstir({ tagHtml, lazy = true, className = "" }) {
  const hostRef = useRef(null);
  const initedRef = useRef(false);

  // 不可視/特殊スペースを正規化（貼り付け汚染対策）
  const normalize = (s) =>
    (s || "").replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, " ").trim();

  // tagHtml から config と loader の src を抽出（順不同OK）
  const extractSrcs = (html) => {
    const srcs = Array.from(html.matchAll(/<script[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gi)).map(
      (m) => m[1]
    );
    let configSrc = srcs.find((s) => /adstir_.*_config\.js($|\?)/.test(s)) || "";
    let loaderSrc = srcs.find((s) => /js\.ad-stir\.com\/js\/adstir\.js($|\?)/.test(s)) || "";

    // 絶対/相対の扱いは iframe 内で親と同一オリジンのまま解決される
    return { configSrc, loaderSrc };
  };

  const writeIframe = (container, rawTagHtml) => {
    container.textContent = "";

    const iframe = document.createElement("iframe");
    Object.assign(iframe.style, {
      display: "block",
      width: "100%",
      height: "100%",
      border: "0",
      overflow: "hidden",
    });
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameBorder", "0");
    iframe.setAttribute("aria-label", "adstir-ad-iframe");
    container.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const { configSrc, loaderSrc } = extractSrcs(normalize(rawTagHtml));

    // 安全ガード：どちらか欠けていたら何もしない
    if (!configSrc || !loaderSrc) {
      doc.open();
      doc.write(`<!doctype html><html><body>
        <div style="font:12px/1.4 system-ui, sans-serif;color:#888;padding:4px 0;text-align:center">
          <!-- adstir tag missing: config or loader not found -->
        </div></body></html>`);
      doc.close();
      return;
    }

    // iframe 内 HTML（config を <script src> で先に読み込む）
    // その後、inline bootstrap が window.adstir_vars を待ってから adstir.js を append
    const bootstrap = `
      (function(){
        var MAX_WAIT = 5000; // 5s
        var START = Date.now();
        function hasVars(){ return typeof window.adstir_vars === 'object' && window.adstir_vars; }
        function loadLoader(){
          var s=document.createElement('script');
          s.src='${loaderSrc}';
          s.async=false;
          document.body.appendChild(s);
        }
        function tick(){
          if (hasVars()) { loadLoader(); return; }
          if (Date.now()-START > MAX_WAIT) { /* give up quietly */ return; }
          setTimeout(tick, 30);
        }
        tick();
      })();
    `;

    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;overflow:hidden">
  <div id="adstir-slot"></div>
  <script src="${configSrc}"></script>
  <script>${bootstrap}</script>
</body>
</html>`;

    try {
      doc.open();
      doc.write(html);
      doc.close();
    } catch {
      // 例外時は何もしない（以降の描画を阻害しない）
    }
  };

  useEffect(() => {
    if (!hostRef.current || initedRef.current) return;

    const run = () => {
      if (!hostRef.current || initedRef.current) return;
      initedRef.current = true;
      writeIframe(hostRef.current, tagHtml || "");
    };

    if (!lazy) {
      run();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(hostRef.current);
    return () => io.disconnect();
  }, [tagHtml, lazy]);

  return (
    <div className={className}>
      <div ref={hostRef} aria-label="adstir-ad" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
