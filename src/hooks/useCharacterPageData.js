// src/hooks/useCharacterPageData.js
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useToolCore from './useToolCore.js';                 // default export
import { normalizeId, canonicalId } from '../utils/ids.js'; // 既存ユーティリティ
import { countActivatedSkills } from '../utils/match.js';   // Toolと同じ判定に寄せる

const TOP_N = 12; // 共起キャラの上位何人までから4人組を作るか（調整可）

export function useCharacterPageData() {
  const { pathname } = useLocation();
  const id = (pathname.split('/')[2] || '').trim();

  const { getShareUrl, getCharacterById, matchSkills, characterList } = useToolCore();

  const character = useMemo(() => {
    if (!id) return null;
    return getCharacterById?.(id) ?? null;
  }, [id, getCharacterById]);

  const combosTop = useMemo(() => {
    if (!character || !Array.isArray(matchSkills) || matchSkills.length === 0) return [];

    const targetNorm = normalizeId(character.id);

    // 1) 対象キャラと一緒にスキルに登場する「共起キャラ」の頻度集計
    const coFreq = new Map(); // normId -> count
    for (const s of matchSkills) {
      // targets配列があれば優先、無ければ target1..5 から構築
      const raw = Array.isArray(s.targets) && s.targets.length
        ? s.targets
        : [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
      if (!raw || raw.length === 0) continue;

      const members = raw.map(normalizeId).filter(Boolean);
      if (!members.includes(targetNorm)) continue;

      for (const m of members) {
        if (m === targetNorm) continue;
        coFreq.set(m, (coFreq.get(m) || 0) + 1);
      }
    }

    // 2) 共起上位 TOP_N を抽出（characterListに存在するものだけ）
    const knownIds = new Set((characterList || []).map(c => normalizeId(c.id)));
    const coTop = [...coFreq.entries()]
      .filter(([m]) => knownIds.has(m))
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([m]) => m);

    if (coTop.length < 4) {
      // まだデータが薄い場合は、全キャラから補完して上位に足す（同一人物は除外）
      for (const c of characterList) {
        const cid = normalizeId(c.id);
        if (cid === targetNorm) continue;
        if (!coTop.includes(cid)) coTop.push(cid);
        if (coTop.length >= TOP_N) break;
      }
    }

    // 3) coTop から4人取り出し＋対象キャラで「5人チーム」を生成し、発動数を計算
    const results = [];
    const seen = new Set(); // 重複チームの除外

    const n = coTop.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = j + 1; k < n; k++) {
          for (let l = k + 1; l < n; l++) {
            const team = [targetNorm, coTop[i], coTop[j], coTop[k], coTop[l]];
            // normalize & unique key
            const key = team.slice().sort().join('|');
            if (seen.has(key)) continue;
            seen.add(key);

            // Toolと同じ関数で評価（重要）
            const count = countActivatedSkills(team);

            results.push({
              key,
              members: team.slice().sort((a, b) => a.localeCompare(b)),
              count,
              shareUrl: getShareUrl ? getShareUrl(team) : '/tool',
            });
          }
        }
      }
    }

    // 4) 発動数降順で上位30件
    results.sort((a, b) => b.count - a.count);
    return results.slice(0, 30);
  }, [character, matchSkills, characterList, getShareUrl]);

  return { character, combosTop, isLoading: false };
}
