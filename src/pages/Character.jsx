// src/pages/Character.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import TwoColumnLayout from '../layouts/TwoColumnLayout.jsx';
import SideMenu from '../layouts/SideMenu.jsx';
import RightAds from '../layouts/RightAds.jsx';
import useToolCore from '../hooks/useToolCore.js';
import { useAnchorCombosFromData } from '../hooks/useAnchorCombosFromData.js';
import { normalizeId, canonicalId } from '../utils/ids.js';
import { matchSkills as matchSkillsRaw } from '../data/matchSkills';

// 共有URL（?ids=）URL-safe Base64(JSON)
function encodeIdsForShare(ids) {
  try {
    const json = JSON.stringify(ids);
    const b64 = typeof window === 'undefined'
      ? Buffer.from(json).toString('base64')
      : window.btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch { return ''; }
}

// /character/:id と /character?id= の両対応でアンカーIDを取得
function useAnchorIdFromLocation() {
  const { pathname, search } = useLocation();
  const seg = (pathname || '').split('/').filter(Boolean);
  let id = '';
  if (seg[0] === 'character' && seg[1]) id = seg[1];
  if (!id) {
    const q = new URLSearchParams(search);
    id = q.get('id') || '';
  }
  return id.trim();
}

// 不可視文字・各種ハイフンを吸収して画像IDに使える形へ
function cleanId(raw) {
  let s = String(raw || '');
  try { s = s.normalize('NFKC'); } catch {}
  s = s.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD\u180E\uFE0E\uFE0F]/g, '');
  s = s.replace(/[‐-‒–—―−－]/g, '-');
  return s.trim();
}

// targets 抽出（配列 or target1..5）
function extractTargets(s) {
  if (Array.isArray(s.targets) && s.targets.length) return s.targets;
  return [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
}

// 画像コンポーネント（小文字フォールバック付き）
function Avatar({ id, alt, size = 48 }) {
  const safeId = cleanId(id);
  return (
    <img
      src={`/images/${safeId}.png`}
      alt={alt || safeId}
      style={{ width: size, height: size }}
      onError={(e) => {
        const el = e.currentTarget;
        if (!el.dataset.lowerTried) {
          el.dataset.lowerTried = '1';
          el.src = `/images/${safeId.toLowerCase()}.png`;
        } else {
          el.onerror = null;
          el.src = '/images/placeholder.png';
        }
      }}
    />
  );
}
// ▼ 既存の cleanId / normalizeId がある前提

// 組み合わせの順不同キー（canonical）
function comboCanonKey(ids) {
  return (ids || [])
    .map((x) => normalizeId(cleanId(String(x))))
    .sort()
    .join('|');
}

// 順不同重複を1件に統合し、スキル名もユニーク化して付与
// rows: [{ key, members:[id...]}...]（useAnchorCombosFromData の戻り）
function dedupeCombosWithSkills(rows, skillNamesByTargetKey) {
  const byKey = new Map(); // canonKey -> { key, members, skillNames:Set }

  for (const r of Array.isArray(rows) ? rows : []) {
    const members = Array.isArray(r.members) ? r.members.map((x) => cleanId(String(x))) : [];
    if (members.length === 0) continue;

    const canon = comboCanonKey(members);

    // 表示用は canonical 昇順の安定並びに揃える
    const membersStable = [...members].sort((a, b) =>
      normalizeId(cleanId(a)).localeCompare(normalizeId(cleanId(b)))
    );

    // スキル名（この targets に紐づくものの集合）
    const names = skillNamesByTargetKey.get(canon) || [];
    let rec = byKey.get(canon);
    if (!rec) {
      rec = { key: canon, members: membersStable, skillNames: new Set() };
      byKey.set(canon, rec);
    }
    for (const nm of names) rec.skillNames.add(nm);
  }

  // 出力形式に整形（skillNames は配列化）
  return [...byKey.values()].map((v) => ({
    key: v.key,
    members: v.members,
    skillNames: Array.from(v.skillNames),
  }));
}


// ─────────────────────────────────────────────────────────────

export default function Character() {
  const { pathname } = useLocation();
  const anchorId = useAnchorIdFromLocation();

  // Hookは早期returnより前に必ず1回だけ
  const {
    pairs: pairsData,
    trios: triosData,
    quads: quadsData,
    quints: quintsData
  } = useAnchorCombosFromData(anchorId);

  const { getCharacterById, getShareUrl, characterList } = useToolCore();
  const character = useMemo(
    () => (anchorId ? (getCharacterById?.(anchorId) ?? null) : null),
    [anchorId, getCharacterById]
  );


  // 下部に出す「他キャラ一覧」（現在のキャラを除外、ID昇順、最大120件）
  const otherCharacters = useMemo(() => {
    const list = Array.isArray(characterList) ? characterList : [];
    const anchor = canonicalId(character?.id || '');
    return [...list]
      .map(c => ({ id: canonicalId(c.id || ''), name: c.name || c.id || '' }))
      .filter(c => c.id && c.id !== anchor)
      .sort((a, b) => a.id.localeCompare(b.id))
      .slice(0, 120);
  }, [characterList, character]);

  // 表示名解決マップ
  const nameByRawId = useMemo(() => {
    const m = new Map();
    for (const c of characterList || []) m.set(String(c.id), c.name);
    return m;
  }, [characterList]);

  // ② スキル名表示のための「targetsキー → スキル名配列」索引を作成
  //    キーは normalizeId → sort → join("|")
  const skillNamesByTargetKey = useMemo(() => {
    const map = new Map();
    for (const row of matchSkillsRaw || []) {
      const t = extractTargets(row);
      if (!t || !t.length) continue;
      const key = t.map((x) => normalizeId(cleanId(String(x)))).sort().join('|');
      if (!key) continue;
      const name = String(row.name || '').trim() || '（無題）';
      if (!map.has(key)) map.set(key, new Set());
      map.get(key).add(name);
    }
    // Set → Array 化
    const out = new Map();
    for (const [k, set] of map.entries()) out.set(k, Array.from(set));
    return out;
  }, []);

  // （中略）skillNamesByTargetKey の useMemo が定義された後に追加
  const pairsUniq  = useMemo(
    () => dedupeCombosWithSkills(pairsData,  skillNamesByTargetKey),
    [pairsData,  skillNamesByTargetKey]
  );
  const triosUniq  = useMemo(
    () => dedupeCombosWithSkills(triosData,  skillNamesByTargetKey),
    [triosData,  skillNamesByTargetKey]
  );
  const quadsUniq  = useMemo(
    () => dedupeCombosWithSkills(quadsData,  skillNamesByTargetKey),
    [quadsData,  skillNamesByTargetKey]
  );
  const quintsUniq = useMemo(
    () => dedupeCombosWithSkills(quintsData, skillNamesByTargetKey),
    [quintsData, skillNamesByTargetKey]
  );


  // 表示用ラベル（名前 → なければID）
  const anchorLabel = useMemo(
    () => (character?.name || character?.id || 'このキャラ'),
    [character]
  );


  // ─── 5名の上位30：プリコンピュートJSONを読むだけ（3列表示） ───
  const [isLoading, setIsLoading] = useState(true);
  const [combosTop, setCombosTop] = useState([]);

  useEffect(() => {
    let abort = false;
    async function load() {
      setIsLoading(true);
      try {
        if (!anchorId) { setCombosTop([]); return; }

        const tryFetch = async (name) => {
          const url = `/combos/${encodeURIComponent(name)}.json?v=${Date.now()}`;
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) return null;
          return res.json();
        };

        let rows = await tryFetch(anchorId);
        if (!rows) rows = await tryFetch(String(anchorId).toLowerCase());
        if (abort || !Array.isArray(rows)) { setCombosTop([]); return; }

        const mapped = rows.map((r, idx) => {
          const members = Array.isArray(r.ids) ? r.ids.map((x) => cleanId(String(x))) : [];
          const key = members.slice().sort().join('|') || `auto-${idx}`;
          const shareUrl = getShareUrl ? getShareUrl(members) : `/tool?ids=${encodeIdsForShare(members)}`;
          return { key, members, count: Number(r.count || 0), shareUrl };
        });
        mapped.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
        setCombosTop(mapped.slice(0, 12));
      } catch (e) {
        console.error('Failed to load /combos JSON:', e);
        setCombosTop([]);
      } finally {
        if (!abort) setIsLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, [anchorId, getShareUrl]);

  if (isLoading) return <div className="p-6">Loading...</div>;

  if (!character) {
    return (
      <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
        <section className="p-6 space-y-3">
          <div>キャラが見つかりません（path: <code>{pathname}</code>）</div>
          <a href="/characters" className="link link-primary">全キャラクター一覧を見る</a>
        </section>
      </TwoColumnLayout>
    );
  }

  // 指定メンバーの targets キーを作ってスキル名配列を取得
  const getSkillNames = (ids) => {
    const key = (ids || []).map((x) => normalizeId(cleanId(String(x)))).sort().join('|');
    return skillNamesByTargetKey.get(key) || [];
  };

  // 共通コンポーネント（グリッド列数とスキル名表示の有無を可変）
  const ComboGrid = ({ title, rows, k, cols = 3, showSkill = false }) => {
    if (!rows || rows.length === 0) return null; // 見出しごと非表示

    // グリッド列クラス（モバイルでの可読性も確保）
    // 3列: grid-cols-1 sm:grid-cols-2 md:grid-cols-3
    // 4列: grid-cols-2 md:grid-cols-4
    const gridClass =
      cols === 4
        ? 'grid grid-cols-2 md:grid-cols-4 gap-3'
        : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3';

    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <ul className={gridClass}>
          {rows.map((row, idx) => {
            const ids = row.members;
            const key = `${row.key}-${idx}`;
            const share = getShareUrl ? getShareUrl(ids) : `/tool?ids=${encodeIdsForShare(ids)}`;

            const skillNames = showSkill
              ? (Array.isArray(row.skillNames) && row.skillNames.length
                  ? row.skillNames
                  : getSkillNames(ids))
              : [];

            return (
              <li key={key} className="card bg-base-100 shadow-sm p-3 flex flex-col justify-between">
                <div className="flex items-center gap-1 flex-wrap mb-2">
                  {ids.map((id) => (
                    <Avatar key={id} id={id} alt={nameByRawId.get(id) || id} />
                  ))}
                </div>
                {showSkill && skillNames.length > 0 && (
                  <div className="text-xs opacity-80 line-clamp-2 mb-2">
                    発動するスキル名：{skillNames.join('、')}
                  </div>
                )}
                <div className="mt-auto">
                  <a href={share} className="btn btn-sm btn-primary w-full">この{k}人で見る</a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="p-4 space-y-8">
        {/* ヘッダー */}
        <header className="flex items-center gap-4">
          <Avatar id={String(character.id)} alt={character.name} size={64} />
          <div>
            <h1 className="text-xl font-bold">{character.name}</h1>
          </div>
        </header>

        {/* 5名：プリコンピュート（上位30） → 3列 */}
        {combosTop.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{anchorLabel} を含む 発動数の多いチーム編成</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {combosTop.map((row) => (
                <li key={row.key} className="card bg-base-100 shadow-sm p-3 flex flex-col justify-between">
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {row.members.map((id) => (
                      <Avatar key={id} id={id} alt={nameByRawId.get(id) || id} />
                    ))}
                  </div>
                  <div className="text-sm opacity-70 whitespace-nowrap mb-2">発動数：{row.count}</div>
                  <a href={row.shareUrl} className="btn btn-sm btn-primary w-full">この5人で見る</a>
                </li>
              ))}
            </ul>

          </div>
        )}

        <div className="space-y-3 mt-6">
          <h2 className="text-lg font-semibold">他の組み合わせを探す</h2>
          <a href="/tool" className="btn btn-sm btn-secondary w-full">チーム編成作成ツールへ</a>
        </div>
        <div className="divider"></div>

        {/* 2〜5名：データ由来の全件表示（スキル名付き） */}
        <ComboGrid title={`${anchorLabel} を含む 2人の組み合わせ`} rows={pairsUniq}  k={2} cols={4} showSkill />
        <ComboGrid title={`${anchorLabel} を含む 3人の組み合わせ`} rows={triosUniq}  k={3} cols={4} showSkill />
        <ComboGrid title={`${anchorLabel} を含む 4人の組み合わせ`} rows={quadsUniq}  k={4} cols={3} showSkill />
        <ComboGrid title={`${anchorLabel} を含む 5人の組み合わせ`} rows={quintsUniq} k={5} cols={3} showSkill />

        <div className="divider"></div>

         {/* ── 最下部：他キャラへの導線（小カード一覧） ── */}
         {otherCharacters.length > 0 && (
           <div className="space-y-3 mt-6">
             <h2 className="text-lg font-semibold">他のキャラを見る</h2>
             <ul
               style={{
                 display: 'flex',
                 flexWrap: 'wrap',
                 gap: '5px',
                 listStyle: 'none',
                 padding: 0,
                 margin: 0,
               }}
             >
               {otherCharacters.map(({ id, name }) => (
                 <li
                   key={id}
                   title={name}
                   style={{
                     border: '2px solid #ccc',
                     borderRadius: '8px',
                     padding: '2px',
                     cursor: 'pointer',
                     width: '75px',
                     textAlign: 'center',
                     backgroundColor: 'white',
                     color: '#000',
                   }}
                 >
                   <Link to={`/character/${id}`} title={name} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                     <img
                       alt={name}
                       src={`/images/${id}.png`}
                       style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                       onError={(e) => {
                         const el = e.currentTarget;
                         if (!el.dataset.lowerTried) {
                           el.dataset.lowerTried = '1';
                           el.src = `/images/${id.toLowerCase()}.png`;
                         } else {
                           el.onerror = null;
                           el.src = '/images/placeholder.png';
                         }
                       }}
                     />
                     <div style={{ fontSize: '10px' }}>{name}</div>
                   </Link>
                 </li>
               ))}
             </ul>
           </div>
         )}
      </section>
    </TwoColumnLayout>
  );
}
