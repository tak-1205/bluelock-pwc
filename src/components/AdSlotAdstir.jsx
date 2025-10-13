// src/components/AdSlotAdstir.jsx
import React, { useEffect, useRef } from "react";

/**
 * AdSlotAdstir（iframeサンドボックス版）
 *
 * 背景:
 * - adstir.js は document.write を用いるため、SPA後挿入だと
 *   「非同期scriptから document.write 禁止」エラーが出やすい。
 * 解法:
 * - フレンドリー iframe を生成し、その中に config→loader を
 *   順序通りで document.write させる（doc.open/write/close）。
 *
 * 特徴:
 * - lazy: IntersectionObserver でビューポート付近で初期化
 * - tagHtml: <script src="/adstir_*_config.js"></script><script src="https://js.ad-stir.com/js/adstir.js"></script>
 * - 幅/高さは親（ラッパー）で管理。iframe 自体は100%でフィットさせる。
 */

export default function AdSlotAdstir({ tagHtml, lazy = true, className = "" }) {
  const hostRef = useRef(null);
  const initedRef = useRef(false);

  // 不可視スペースなどの正規化（貼付け時の混入対策）
  const normalizeHtml = (html) =>
    (html || "")
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, " ")
      .trim();

  // iframe に ad タグを書き込む（順序は tagHtml の記述順）
  const writeIntoIframe = (container, html) => {
    // 古い要素をクリア
    container.textContent = "";

    const iframe = document.createElement("iframe");
    // レイアウトは親で幅・高さを決めるので、iframe は100%でフィット
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

    // adstir は document.write を想定しているため、open→write→close で同期的に流し込む
    // body 直下にそのまま tagHtml を書き込む（config → loader の順が大事）
    const safeHtml = normalizeHtml(html);
    const htmlDoc = [
      "<!doctype html>",
      "<html><head><meta charset='utf-8' /></head><body>",
      // ラッパー（なくてもよいが計測用にidを付けておく）
      "<div id='adstir-slot'></div>",
      safeHtml,
      "</body></html>",
    ].join("");

    try {
      doc.open();
      doc.write(htmlDoc);
      doc.close();
    } catch {
      // 万一 iframe 書き込みに失敗した場合は、フォールバック（非推奨）
      // ただし adstir.js は document.write 前提のため、基本は iframe 書込のみで十分
    }
  };

  useEffect(() => {
    if (!hostRef.current || initedRef.current) return;

    const run = () => {
      if (!hostRef.current || initedRef.current) return;
      initedRef.current = true;
      writeIntoIframe(hostRef.current, tagHtml);
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
      {/* 親側で w-[320px]/w-[300px] & min-h を指定しておくこと */}
      <div ref={hostRef} aria-label="adstir-ad" style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
