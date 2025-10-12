import React, { useEffect, useRef } from "react";

/**
 * AdSlotAdstir
 * - adstirタグ原文（<script>のみや、<div>+<script>の両方）に対応
 * - innerHTML では <script> が実行されないため、解析して <script> を生JSノードで挿入
 * - 順序を厳密に保持して挿入する（設定→ローダーの順）
 */
export default function AdSlotAdstir({ tagHtml, lazy = true, className = "" }) {
  const hostRef = useRef(null);
  const initedRef = useRef(false);

  useEffect(() => {
    if (!hostRef.current || initedRef.current) return;

    const insertSafely = () => {
      if (!hostRef.current || initedRef.current) return;
      initedRef.current = true;

      // 一時コンテナでHTMLをパース
      const tmp = document.createElement("div");
      tmp.innerHTML = tagHtml;

      // 挿入先を空に
      hostRef.current.textContent = "";

      // ノードを順に処理：<script>は生ノードで生成・実行、それ以外はそのまま移植
      const appendNode = (node) => {
        if (node.nodeName.toLowerCase() === "script") {
          const s = document.createElement("script");
          // 属性をコピー
          for (const attr of node.attributes) {
            s.setAttribute(attr.name, attr.value);
          }
          // インラインスクリプトの内容
          if (!s.src && node.textContent) {
            s.text = node.textContent;
          }
          hostRef.current.appendChild(s);
        } else {
          hostRef.current.appendChild(node.cloneNode(true));
        }
      };

      // childNodes を順に挿入（順序厳守）
      Array.from(tmp.childNodes).forEach(appendNode);
    };

    if (!lazy) {
      insertSafely();
      return;
    }

    // 遅延初期化（画面内に入ったら）
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          insertSafely();
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
      <div ref={hostRef} aria-label="adstir-ad" />
    </div>
  );
}
