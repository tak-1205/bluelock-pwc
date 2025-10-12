import React, { useEffect, useRef } from "react";

/**
 * AdSlotAdstir
 * - <script>のみ / <div>+<script> どちらのタグでもOK
 * - 外部scriptは“直列に”ロード（config → loader）して順序を保証
 */
export default function AdSlotAdstir({ tagHtml, lazy = true, className = "" }) {
  const hostRef = useRef(null);
  const initedRef = useRef(false);

  useEffect(() => {
    if (!hostRef.current || initedRef.current) return;

    const run = async () => {
      if (!hostRef.current || initedRef.current) return;
      initedRef.current = true;

      // 一時DOMで分解
      const tmp = document.createElement("div");
      tmp.innerHTML = tagHtml;
      hostRef.current.textContent = "";

      // childNodes を配列化（順序厳守）
      const nodes = Array.from(tmp.childNodes);

      // ノードを1つずつ処理。外部scriptはonloadを待ってから次へ。
      for (const node of nodes) {
        if (node.nodeName.toLowerCase() !== "script") {
          hostRef.current.appendChild(node.cloneNode(true));
          continue;
        }

        await new Promise((resolve) => {
          const s = document.createElement("script");
          // 属性コピー
          for (const attr of node.attributes) s.setAttribute(attr.name, attr.value);

          if (node.src) {
            // 外部script：読み込み完了後に次へ
            s.onload = () => resolve();
            s.onerror = () => resolve(); // 失敗しても先に進む（無限待ち防止）
            // asyncを明示的にfalse相当（順序制御はonloadでやる）
            s.async = false;
            hostRef.current.appendChild(s);
          } else {
            // インラインscript：その場で同期実行
            s.text = node.textContent || "";
            hostRef.current.appendChild(s);
            resolve();
          }
        });
      }
    };

    if (!lazy) {
      run();
      return;
    }

    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        run();
        io.disconnect();
      }
    }, { rootMargin: "200px" });

    io.observe(hostRef.current);
    return () => io.disconnect();
  }, [tagHtml, lazy]);

  return (
    <div className={className}>
      <div ref={hostRef} aria-label="adstir-ad" />
    </div>
  );
}
