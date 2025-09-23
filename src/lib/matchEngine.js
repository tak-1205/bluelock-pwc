// src/lib/matchEngine.js
import { normalizeId } from '../utils/ids.js';

// ツール/スクリプト共通：1行のスキルからtargets配列を抽出
export function extractTargets(skill) {
  if (Array.isArray(skill?.targets) && skill.targets.length) return skill.targets;
  return [skill.target1, skill.target2, skill.target3, skill.target4, skill.target5].filter(Boolean);
}

// データ正規化して“同一targetsは1回だけ”にする
export function packSkills(matchSkills) {
  const uniqueBySig = new Map(); // sig -> string[] normalized targets
  for (const s of Array.isArray(matchSkills) ? matchSkills : []) {
    const raw = extractTargets(s);
    if (!raw?.length) continue;
    const norm = Array.from(new Set(raw.map(normalizeId).filter(Boolean))); // 1スキル内の重複排除
    if (!norm.length) continue;
    const sig = norm.slice().sort().join('|'); // 同一targetsセットは1回だけ
    if (!uniqueBySig.has(sig)) uniqueBySig.set(sig, norm);
  }
  return [...uniqueBySig.values()]; // string[][]
}

// 共有カウンタ（純関数）
export function makeMatchCounterFromSkills(matchSkills) {
  const packed = packSkills(matchSkills);
  return function countActivatedSkills(teamIds) {
    const set = new Set((teamIds || []).map(normalizeId).filter(Boolean));
    let cnt = 0;
    for (const targets of packed) {
      let ok = true;
      for (const id of targets) { if (!set.has(id)) { ok = false; break; } }
      if (ok) cnt++;
    }
    return cnt;
  };
}
