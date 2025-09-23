// src/hooks/useAnchorCombosFromData.js
import { useMemo } from 'react';
import { matchSkills as matchSkillsRaw } from '../data/matchSkills';
import { normalizeId, canonicalId, canonicalRootId } from '../utils/ids';

function rootsUnique(ids){
 const roots = ids.map(canonicalRootId);
 return new Set(roots).size === roots.length;
}

// 不可視文字や全角ハイフン等を除去/正規化（表示直前用）
function cleanId(raw) {
  let s = String(raw || '');
  // 互換正規化
  try { s = s.normalize('NFKC'); } catch {}
  // 各種不可視/制御/バリアント選択子を除去
  s = s.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD\u180E\uFE0E\uFE0F]/g, '');
  // 全角や類似ハイフンを ASCII ハイフンに統一
  s = s.replace(/[‐-‒–—―−－]/g, '-');
  // 末尾/先頭の空白を除去
  s = s.trim();
  return s;
}

function extractTargets(s) {
  if (Array.isArray(s.targets) && s.targets.length) return s.targets;
  return [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
}

export function useAnchorCombosFromData(anchorId) {
  return useMemo(() => {
    const anchorNorm = normalizeId(anchorId || '');
    const anchorCanon = canonicalId(anchorNorm);

    const pairs = [];
    const trios = [];
    const quads = [];
    const quints = [];

    for (const s of (matchSkillsRaw || [])) {
      const tRaw = extractTargets(s);
      if (!tRaw || tRaw.length < 2) continue; // 2〜5人のみ

      const tNorm = tRaw.map(normalizeId);
      const hasAnchor =
        tNorm.includes(anchorNorm) ||
        tNorm.map(canonicalId).includes(anchorCanon);

      if (!hasAnchor) continue;

      // ★ 表示/画像/共有URL用に ID を無害化（ファイル名と必ず一致させる）
      const members = tRaw.map((id) => cleanId(id));

      // 重複行も「そのまま」表示したいので key はゆるく一意化
      const key =
        members.slice().sort().join('|') +
        '::' + (s.name || '') +
        '::' + (s.detail || s.effect || '');

      const row = { key, members, size: members.length };

        if (members.length === 2)      { if (rootsUnique(members)) pairs.push(row); }
        else if (members.length === 3) { if (rootsUnique(members)) trios.push(row); }
        else if (members.length === 4) { if (rootsUnique(members)) quads.push(row); }
        else if (members.length === 5) { if (rootsUnique(members)) quints.push(row); }
    }

    return { pairs, trios, quads, quints };
  }, [anchorId]);
}
