// src/hooks/useTopFiveFromDisplayed.js
// 表示中の 2〜5名コンボから候補プールを作成し、アンカー＋4名の全組み合わせを
// タイムスライスで評価して上位30件を返す。
// 重要: プールは “1〜nホップ拡張” でアンカー非包含行のメンバーも取り込む。

import { useEffect, useMemo, useState } from 'react';
import { matchSkills as matchSkillsRaw } from '../data/matchSkills';
import { normalizeId, canonicalId } from '../utils/ids.js';
import { countActivatedSkills } from '../utils/match.js';

// ID無害化（不可視/全角ハイフン等を除去・統一）
function cleanId(raw) {
  let s = String(raw || '');
  try { s = s.normalize('NFKC'); } catch {}
  s = s.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD\u180E\uFE0E\uFE0F]/g, '');
  s = s.replace(/[‐-‒–—―−－]/g, '-');
  return s.trim();
}
function extractTargets(s) {
  if (Array.isArray(s.targets) && s.targets.length) return s.targets;
  return [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
}

export function useTopFiveFromDisplayed(anchorId, { pairs, trios, quads, quints }, opts = {}) {
  const TOP_N      = Number(opts.topN || 30);
  const PER_ROOT   = Number(opts.perRoot || 3);     // 同名系の採用上限（候補プール）
  const SLICE_OPS  = Number(opts.sliceOps || 1500); // 1スライス評価件数
  const EXPAND_HOPS= Number(opts.expandHops || 1);  // プール拡張のホップ数（1推奨、最大2程度）

  const anchorRaw   = String(anchorId || '');
  const anchorNorm  = normalizeId(anchorRaw);
  const anchorCanon = canonicalId(anchorNorm);

  // --- 0) 初期シード（表示中の行に出た全メンバー） ---
  const seedSet = useMemo(() => {
    const s = new Set();
    const addAll = (rows) => {
      for (const r of rows || []) for (const id of r.members || []) s.add(cleanId(id));
    };
    addAll(pairs); addAll(trios); addAll(quads); addAll(quints);
    return s;
  }, [pairs, trios, quads, quints]);

  // --- 1) プール拡張（1〜nホップ）。アンカー非包含行からもメンバーを取り込む ---
  const poolRaw = useMemo(() => {
    if (!anchorNorm) return [];
    // workSets[0] = アンカー + 初期シード
    let frontier = new Set([anchorRaw, ...seedSet]);
    let pool = new Set([...seedSet]); // 集約（アンカーは後で除外）

    const toNorm = (id) => normalizeId(cleanId(id));

    for (let hop = 0; hop < Math.max(0, EXPAND_HOPS); hop++) {
      const nextFrontier = new Set();
      for (const row of (matchSkillsRaw || [])) {
        const memRaw = extractTargets(row);
        if (!memRaw || memRaw.length === 0) continue;
        const memNorm = memRaw.map(toNorm);

        // フロンティアの誰かが含まれていれば、その行の全員を追加
        let hit = false;
        for (const id of memNorm) {
          if (frontier.has(id)) { hit = true; break; }
        }
        if (!hit) continue;

        for (const raw of memRaw) {
          const cid = cleanId(raw);
          pool.add(cid);
          nextFrontier.add(toNorm(raw));
        }
      }
      // 次のホップへ
      frontier = nextFrontier;
    }

    // アンカー（同名系含む）は候補から除外
    const out = [];
    for (const raw of pool) {
      const can = canonicalId(normalizeId(raw));
      if (can === anchorCanon) continue;
      out.push(raw);
    }
    return out;
  }, [anchorRaw, anchorNorm, anchorCanon, seedSet, EXPAND_HOPS]);

  // --- 2) 同名系の過多を制限して最終プールを作成 ---
  const pool = useMemo(() => {
    const used = new Map(); // canonical -> used count
    const out = [];
    for (const raw of poolRaw) {
      const can = canonicalId(normalizeId(raw));
      const n = used.get(can) || 0;
      if (n >= PER_ROOT) continue;
      used.set(can, n + 1);
      out.push(raw);
    }
    return out;
  }, [poolRaw, PER_ROOT]);

  // --- 3) 5人列挙＆採点（タイムスライス） ---
  const [top, setTop] = useState([]);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    if (!anchorNorm) { setTop([]); return; }
    const n = pool.length;
    if (n < 4) { setTop([]); return; }

    setComputing(true);
    let results = [];
    let i = 0, j = 1, k = 2, l = 3;
    let canceled = false;

    const nextTuple = () => {
      l++;
      if (l < n) return true;
      k++; if (k < n - 1) { l = k + 1; return true; }
      j++; if (j < n - 2) { k = j + 1; l = k + 1; return true; }
      i++; if (i < n - 3) { j = i + 1; k = j + 1; l = k + 1; return true; }
      return false; // end
    };

    const step = () => {
      if (canceled) return;
      let ops = 0;

      while (ops < SLICE_OPS) {
        if (i >= n - 3) break;

        const a = pool[i], b = pool[j], c = pool[k], d = pool[l];

        // 同名系の同席禁止（アンカー含めて5つの canonical が全て異なること）
        const canSet = new Set([
          anchorCanon,
          canonicalId(normalizeId(a)),
          canonicalId(normalizeId(b)),
          canonicalId(normalizeId(c)),
          canonicalId(normalizeId(d)),
        ]);
        if (canSet.size === 5) {
          const team = [anchorRaw, a, b, c, d];
          const count = countActivatedSkills(team);
          if (count > 0) {
            const ids = team.map((x) => cleanId(x));
            results.push({ ids, count, key: ids.slice().sort().join('|') });
          }
        }

        ops++;
        if (!nextTuple()) break;
      }

      if (i >= n - 3) {
        results.sort((x, y) => y.count - x.count || x.key.localeCompare(y.key));
        setTop(results.slice(0, TOP_N));
        setComputing(false);
        return;
      }

      if ('requestIdleCallback' in window) requestIdleCallback(step, { timeout: 200 });
      else setTimeout(step, 0);
    };

    if ('requestIdleCallback' in window) requestIdleCallback(step, { timeout: 200 });
    else setTimeout(step, 0);

    return () => { canceled = true; };
  }, [anchorRaw, anchorNorm, anchorCanon, pool, SLICE_OPS, TOP_N]);

  return { top5: top, isComputing: computing, poolSize: pool.length };
}
