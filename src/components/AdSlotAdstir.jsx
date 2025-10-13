import React, { useEffect, useRef } from "react";

/**
 * AdSlotAdstir（iframe + robust fallback 版）
 *
 * ポイント
 * - まず tagHtml から /adstir_*_config.js と adstir.js を抽出して「順序保証」実行（config→loader）
 * - もし抽出に失敗したら、tagHtml をそのまま iframe に document.write（= 旧来のタグそのまま）するフォールバック
 * - これで「Network に何も出ない」を確実に回避
 * - ログを十分に出すので、DevTools Console で原因切り分けが即可能
 */

export default function AdSlotAdstir({ tagHtml, lazy = true, className = "" }) {
  const hostRef = useRef(null);
  const initedRef = useRef(false);

  const normalize = (s) =>
    (s || "")
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, " ")
      .trim();

  // tagHtml から src を抽出（順不同OK・大小/空白/改行ゆるめ）
  const extractSrcs = (html) => {
    const srcRegex = /<script[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>\s*<\/script>/gim;
    const srcs = [];
    let m;
    while ((m = srcRegex.exec(html))) srcs.push(m[1]);

    // より寛容に判定（クエリ/ハッシュ付きも許可）
    const isConfig = (s) => /\/adstir_.*_config\.js(\?|#|$)/i.test(s);
    const isLoader = (s) => /js\.ad-stir\.com\/js\/adstir\.js(\?|#|$)/i.test(s);

    const configSrc = srcs.find(isConfig) || "";
    const loaderSrc = srcs.find(isLoader) || "";

    return { configSrc, loaderSrc, allSrcs: srcs };
  };

  const writeHtmlIntoIframe = (container, html) => {
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
    try {
      doc.open();
      doc.write(html);
      doc.close();
    } catch (e) {
      console.warn("[AdSlotAdstir] iframe write failed:", e);
    }
  };

  const bootWithOrderGuarantee = (container, configSrc, loaderSrc) => {
    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;overflow:hidden">
  <div id="adstir-slot"></div>
  <script src="${configSrc}"></script>
  <script>
    (function(){
      var MAX_WAIT=5000, start=Date.now();
      function hasVars(){ return typeof window.adstir_vars==='object' && window.adstir_vars; }
      function loadLoader(){
        var s=document.createElement('script');
        s.src='${loaderSrc}';
        s.async=false;
        document.body.appendChild(s);
      }
      (function tick(){
        if (hasVars()) return loadLoader();
        if (Date.now()-start>MAX_WAIT) return; // give up quietly
        setTimeout(tick, 30);
      })();
    })();
  </script>
</body>
</html>`;
    writeHtmlIntoIframe(container, html);
  };

  const bootWithRawFallback = (container, rawTagHtml) => {
    const safe = normalize(rawTagHtml);
    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;overflow:hidden">
  <div id="adstir-slot"></div>
  ${safe}
</body>
</html>`;
    writeHtmlIntoIframe(container, html);
  };

  useEffect(() => {
    if (!hostRef.current || initedRef.current) return;

    const run = () => {
      if (!hostRef.current || initedRef.current) return;
      initedRef.current = true;

      // クリア
      hostRef.current.textContent = "";

      const raw = tagHtml || "";
      const safe = normalize(raw);
      if (!safe) {
        console.warn("[AdSlotAdstir] empty tagHtml; nothing to load");
        return;
      }

      // まず抽出
      const { configSrc, loaderSrc, allSrcs } = extractSrcs(safe);
      console.debug("[AdSlotAdstir] extracted srcs:", allSrcs);
      console.debug("[AdSlotAdstir] configSrc:", configSrc || "(none)", "loaderSrc:", loaderSrc || "(none)");

      if (configSrc && loaderSrc) {
        // 正常系：順序保証して実行
        bootWithOrderGuarantee(hostRef.current, configSrc, loaderSrc);
      } else {
        // フォールバック：生HTMLをそのまま書き込む（document.write 実行経路）
        console.warn("[AdSlotAdstir] fallback to raw tagHtml write (parser did not find both srcs)");
        bootWithRawFallback(hostRef.current, safe);
      }
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
      {/* 親で SP: w-[320px] min-w-[320px] min-h-[60px] / PC: w-[300px] min-w-[300px] min-h-[250px] を確保 */}
      <div ref={hostRef} aria-label="adstir-ad" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
