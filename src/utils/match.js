// src/utils/match.js
import { matchSkills as matchSkillsRaw } from "../data/matchSkills";
import { normalizeId, canonicalId } from "../utils/ids";

// 一度だけ正規化してキャッシュ（App.jsxの正規化と同等）
let _normalized = null;
function getNormalizedSkills() {
  if (_normalized) return _normalized;
  _normalized = (matchSkillsRaw || []).map((s) => ({
    ...s,
    target1: normalizeId(s.target1),
    target2: normalizeId(s.target2),
    target3: normalizeId(s.target3),
    target4: normalizeId(s.target4),
    target5: normalizeId(s.target5),
    activator1: normalizeId(s.activator1),
    activator2: normalizeId(s.activator2),
    activator3: normalizeId(s.activator3),
    activator4: normalizeId(s.activator4),
    activator5: normalizeId(s.activator5),
  }));
  return _normalized;
}

/** App.jsxと同じ条件＆同じ重複排除で「発動件数」を返す */
export function countActivatedSkills(ids) {
  const normIds = ids.map(normalizeId);
  const set = new Set(normIds);
  const canSet = new Set(normIds.map(canonicalId));

  // 1) 対象＋発動者すべて含むか（正規/Canonical の両方で判定）
  const filtered = getNormalizedSkills().filter((skill) => {
    const targets = [skill.target1, skill.target2, skill.target3, skill.target4, skill.target5].filter(Boolean);
    const activators = [skill.activator1, skill.activator2, skill.activator3, skill.activator4, skill.activator5].filter(Boolean);
    const involved = [...new Set([...targets, ...activators])];

    const ok1 = involved.length > 0 && involved.every((id) => set.has(id));
    if (ok1) return true;

    const involvedCan = involved.map(canonicalId);
    return involvedCan.length > 0 && involvedCan.every((id) => canSet.has(id));
  });

  // 2) 重複排除（name + detail/effect + sorted targets）←App.jsxと同じ
  const seen = new Set();
  let count = 0;
  for (const s of filtered) {
    const targetsKey = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean).sort().join("|");
    const key = `${s.name || ""}__${s.detail || s.effect || ""}__${targetsKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    count++;
  }
  return count;
}

// ---- 共有モジュール連携（プリコンピュート等と同じ関数を使う） ----
// ※ Node 側（プリコンピュート）からは、この utils/match.js を直接 import せず、
//    ../lib/matchEngine.js を直接 import してください（data の import 解決の都合）。

import {
  makeMatchCounterFromSkills as _makeSharedCounter,
  packSkills as _packSkills,
  extractTargets as _extractTargets,
} from '../lib/matchEngine.js';

// プリコンピュート等で使う“共有カウンタ”を再エクスポート
export const makeMatchCounterFromSkills = _makeSharedCounter;
export const packSkills = _packSkills;
export const extractTargets = _extractTargets;

// （任意）フロント側でも“共有ロジック由来”のカウンタを使いたい場合の別名
// 既存の countActivatedSkills と挙動を揃えたい時はこちらを参照してください。
export const countActivatedSkillsShared = _makeSharedCounter(getNormalizedSkills());
