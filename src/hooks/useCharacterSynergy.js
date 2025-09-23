// src/hooks/useCharacterSynergy.js
// 目的：共起ではなく「その2人だけを選択したときの実発動数」で相性順位を返す
// - pairs: [{ id: <相手の実ID>, count: <2人時の発動件数> }, ...] 降順
// - skills: アンカー関連スキル一覧（従来の説明用セクション向けに残置）

import { useMemo } from 'react';
import useToolCore from '../hooks/useToolCore.js';
import { matchSkills as matchSkillsRaw } from '../data/matchSkills';
import { normalizeId, canonicalId } from '../utils/ids';
import { countActivatedSkills } from '../utils/match';

const DATA_VERSION = import.meta.env.VITE_DATA_VERSION || 'v1';

// UIと同じ重複排除キー（targetsでキー化 + name/detail）
function dedupKeyForSkill(s) {
  const targets = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
  const keyTargets = targets.slice().sort().join('|');
  return `${s.name || ''}__${s.detail || s.effect || ''}__${keyTargets}`;
}

// アンカー関連スキル一覧（説明用）
function useRelatedSkills(anchorId) {
  const { uniqSkills } = useMemo(() => {
    // 正規化 & 重複排除（UIと同一）
    const normalized = (matchSkillsRaw || []).map((s) => ({
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
    const seen = new Set();
    const uniq = [];
    for (const s of normalized) {
      const key = dedupKeyForSkill(s);
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(s);
    }
    return { uniqSkills: uniq };
  }, []);

  const relatedSkills = useMemo(() => {
    const anchorNorm = normalizeId(anchorId || '');
    const anchorCanon = canonicalId(anchorNorm);
    const out = [];
    for (const s of uniqSkills) {
      const targets = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
      const activs  = [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean);
      const involved = Array.from(new Set([...targets, ...activs]));
      const involvedCan = involved.map(canonicalId);
      if (involved.includes(anchorNorm) || involvedCan.includes(anchorCanon)) {
        out.push(s);
      }
    }
    return out;
  }, [uniqSkills, anchorId]);

  return { skills: relatedSkills };
}

export function useCharacterSynergy(anchorId) {
  const { characterList } = useToolCore();

  // 2人実発動ベースの相性順位
  const pairs = useMemo(() => {
    const anchor = String(anchorId || '');
    if (!anchor || !Array.isArray(characterList) || characterList.length === 0) return [];

    const anchorNorm = normalizeId(anchor);
    const anchorCanon = canonicalId(anchorNorm);

    // localStorage キャッシュ
    const cacheKey = `pairRank:${DATA_VERSION}:${anchorCanon}`;
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (Array.isArray(cached) && cached.length) {
        // 形式: [{id, count}], id は実ID
        return cached;
      }
    } catch {}

    // 全キャラを候補にして、同名（canonical一致）は除外
    const rows = [];
    for (const c of characterList) {
      const pidRaw = String(c.id);
      const pidNorm = normalizeId(pidRaw);
      if (!pidNorm) continue;
      if (canonicalId(pidNorm) === anchorCanon) continue; // 同名系は除外

      // ★実際のツールと同一関数で「2人だけ選択時の発動数」を算出
      const cnt = countActivatedSkills([anchor, pidRaw]);
      if (cnt > 0) rows.push({ id: pidRaw, count: cnt });
    }

    rows.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

    try { localStorage.setItem(cacheKey, JSON.stringify(rows)); } catch {}

    return rows;
  }, [anchorId, characterList]);

  const { skills } = useRelatedSkills(anchorId);

  return { pairs, skills };
}
