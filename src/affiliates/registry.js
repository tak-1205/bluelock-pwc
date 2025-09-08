// src/affiliates/registry.js
import { catalog } from "./catalog";

/**
 * ページ別の掲載リスト（IDの配列）。左から順に表示。
 * - default: どのページにも適用される基本セット
 * - byPath: 完全一致 or プレフィックス一致（後述の getAffiliateItemsForPath が判定）
 */
export const picks = {
  /** @type {string[]} */
  default: ["amz-1", "amz-2"],

  /** @type {Record<string, string[]>} */
  byPath: {
    "/": ["amz-1", "rak-1"],          // TOP
    "/tool": ["amz-2", "amz-1"],      // ツール
    "/ranking": ["rak-1"],            // ランキング
    // "/privacy": []                 // 空配列なら“なし”
  },
};

/**
 * 現在の pathname に最も適した配列を返す。
 * - 完全一致優先、なければ「最長プレフィックス一致」を採用
 * - 見つからなければ default を返す
 */
export function getAffiliateItemsForPath(pathname) {
  if (!pathname) return mapIds(picks.default);

  // 完全一致
  if (picks.byPath[pathname]) return mapIds(picks.byPath[pathname]);

  // 最長プレフィックス一致
  const entries = Object.entries(picks.byPath);
  let best = null;
  for (const [prefix, ids] of entries) {
    if (pathname.startsWith(prefix)) {
      if (!best || prefix.length > best.prefix.length) {
        best = { prefix, ids };
      }
    }
  }
  return mapIds(best ? best.ids : picks.default);
}

function mapIds(ids) {
  return (ids || []).map((id) => catalog[id]).filter(Boolean);
}
