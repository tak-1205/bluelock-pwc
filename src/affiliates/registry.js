// src/affiliates/registry.js
import { catalog } from "./catalog";

export const picks = {
  // どのページにも適用される基本セット（何も見つからなかったときに使われる）
  default: ["rak-2", "rak-5", "rak-6", "rak-7", "amz-1", "amz-2", "amz-3"],

  // ページ別（完全一致 or 最長プレフィックス一致）
  byPath: {
    //"/": ["amz-1", "rak-1"],      // TOP
    //"/tool": ["amz-2", "amz-1"],  // ツール
    //"/ranking": ["rak-1"],        // ランキング
    // "/privacy": []             // 明示的に“無し”にしたい場合は空配列
  },
};

// ここから下は既存のままでOK
export function getAffiliateItemsForPath(pathname) {
  if (!pathname) return mapIds(picks.default);
  if (picks.byPath[pathname]) return mapIds(picks.byPath[pathname]);

  // 最長プレフィックス一致
  const entries = Object.entries(picks.byPath);
  let best = null;
  for (const [prefix, ids] of entries) {
    if (pathname.startsWith(prefix)) {
      if (!best || prefix.length > best.prefix.length) best = { prefix, ids };
    }
  }
  return mapIds(best ? best.ids : picks.default);
}
function mapIds(ids) {
  return (ids || []).map((id) => catalog[id]).filter(Boolean);
}
