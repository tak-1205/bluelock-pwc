// src/utils/suggestOneOffs.js
import { canonicalId } from "../utils/ids";
import { characterList as characterListRaw } from "../data/characterList";
import { countActivatedSkills } from "./match";

export function suggestOneOffs(selectedIds, topN = 5) {
  const base = Array.from(new Set(selectedIds.map(canonicalId))).sort();
  const baseSet = new Set(base);
  const allIds = characterListRaw.map(c => canonicalId(c.id));

  const map = new Map(); // key: nextIds.join("-")

  for (let i = 0; i < base.length; i++) {
    const removed = base[i];
    for (const id of allIds) {
      if (baseSet.has(id)) continue;
      const next = base.slice();
      next[i] = id;
      next.sort();
      const key = next.join("-");
      if (map.has(key)) continue;

      const score = countActivatedSkills(next);
      map.set(key, { ids: next, add: id, remove: removed, score });
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
