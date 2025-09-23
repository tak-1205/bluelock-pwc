// src/hooks/useAnchorCombosFromData.js
import { useMemo } from 'react';
import { matchSkills as matchSkillsRaw } from '../data/matchSkills';
import { normalizeId, canonicalId } from '../utils/ids.js';

function cleanId(raw) {
  let s = String(raw || '');
  try { s = s.normalize('NFKC'); } catch {}
  s = s.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD\u180E\uFE0E\uFE0F]/g, '');
  s = s.replace(/[‐-‒–—―−－]/g, '-');
  return s.trim();
}
function extractTargets(s) {
  if (Array.isArray(s?.targets) && s.targets.length) return s.targets;
  return [s?.target1, s?.target2, s?.target3, s?.target4, s?.target5].filter(Boolean);
}

export function useAnchorCombosFromData(anchorId) {
  const anchorCanon = canonicalId(normalizeId(anchorId || ''));

  return useMemo(() => {
    const out = { pairs: [], trios: [], quads: [], quints: [] };
    if (!anchorCanon) return out;

    const seen = new Set(); // canonical の並びで重複排除
    for (const row of matchSkillsRaw || []) {
      const memRaw = extractTargets(row);
      if (!memRaw || memRaw.length < 2) continue;

      // canonical 比較でアンカーを含むか判定
      const memCanon = memRaw.map((id) => canonicalId(normalizeId(id)));
      if (!memCanon.includes(anchorCanon)) continue;

      // 行内の同名重複を除去しつつ、出力は画像に合う“cleanId(=raw整形)”で
      const seenCan = new Set();
      const members = [];
      for (const id of memRaw) {
        const can = canonicalId(normalizeId(id));
        if (seenCan.has(can)) continue;
        seenCan.add(can);
        members.push(cleanId(id));
      }

      const size = members.length;
      if (size < 2 || size > 5) continue;

      // 重複排除キー（canonical をソート）
      const sig = Array.from(seenCan).sort().join('|');
      if (seen.has(sig)) continue;
      seen.add(sig);

      const item = { key: sig, members };
      if (size === 2) out.pairs.push(item);
      else if (size === 3) out.trios.push(item);
      else if (size === 4) out.quads.push(item);
      else out.quints.push(item); // size === 5
    }
    return out;
  }, [anchorCanon]);
}
