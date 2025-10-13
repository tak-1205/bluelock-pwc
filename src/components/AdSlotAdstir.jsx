// src/components/AdSlotAdstir.jsx
import React, { useEffect, useRef } from "react";

/**
 * AdSlotAdstir
 * - tagHtml に含まれる <script> / <div> を安全に順序保証で挿入
 * - 外部 <script> は onload/onerror を待って「直列」実行（config → loader）
 * - InvalidCharacterError 対策：
 *   - 不可視スペース（U+3000 含む）などを正規化
 *   - 属性コピーはホワイトリスト方式（未知/不正名は無視）
 */
export default function AdSlotAdstir({ tagHtml, lazy = true, className = "" }) {
  const hostRef = useRef(null);
  const initedRef = useRef(false);

  // 1) 不可視文字の正規化（貼り付け時の全角スペース/ZWSP混入対策）
  const normalizeHtml = (html) =>
    (html || "")
      // NBSP, En/Em space, zero-width 等を半角スペースへ正規化
      .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, " ")
      .trim();

  // 2) 属性名の正規化（不可視文字除去＋trim）
  const normalizeAttrName = (name) =>
    String(name || "").replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]+/g, "").trim();

  // 3) <script> 属性ホワイトリスト
  //    代表的な安全属性のみ許可。data-* は通す。
  const SCRIPT_ATTR_WHITELIST = /^(src|async|defer|crossorigin|referrerpolicy|type|nonce|integrity|data-[\w-]+)$/i;

  // 4) HTML → Node 群（順序保持）に分解（template 経由で script 自動実行を防止）
  const toOrderedNodes = (html) => {
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    return Array.from(tpl.content.childNodes);
  };

  // 5) 子ノードを順にマウント。<script> は安全コピー＋直列ロード。
  const mountNodesSequentially = async (container, nodes) => {
    for (const node of nodes) {
      // 非 <script> はそのままクローンして追加
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() !== "script") {
        container.appendChild(node.cloneNode(true));
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE || node.tagName.toLowerCase() !== "script") {
        // テキストノード等は無視（必要なら挿入してもOK）
        continue;
      }

      // <script> は安全コピー
      await new Promise((resolve) => {
        try {
          const s = document.createElement("script");

          // 属性コピー（不正名は除去）
          for (const attr of Array.from(node.attributes)) {
            const name = normalizeAttrName(attr.name).toLowerCase();
            if (SCRIPT_ATTR_WHITELIST.test(name)) {
              s.setAttribute(name, attr.value);
            }
          }

          // 直列実行を担保（外部は onload/onerror 待ち、inline は同期）
          if (s.hasAttribute("src")) {
            s.async = false; // 明示
            s.onload = () => resolve();
            s.onerror = () => resolve(); // 失敗でも次へ進めてハング防止
            container.appendChild(s);
          } else {
            // inline script
            s.text = node.textContent || "";
            container.appendChild(s);
            resolve();
          }
        } catch (_e) {
          // 万一の例外でも先へ進む
          resolve();
        }
      });
    }
  };

  useEffect(() => {
    if (!hostRef.current || initedRef.current) return;

    const run = async () => {
      if (!hostRef.current || initedRef.current) return;
      initedRef.current = true;

      const safeHtml = normalizeHtml(tagHtml);
      // 初期化（再実行時の残骸もクリア）
      hostRef.current.textContent = "";

      const nodes = toOrderedNodes(safeHtml);
      await mountNodesSequentially(hostRef.current, nodes);
    };

    if (!lazy) {
      run();
      return;
    }

    // ビューポート付近で起動（遅延ロード）
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
      <div ref={hostRef} aria-label="adstir-ad" />
    </div>
  );
}
