// src/pages/Characters.jsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import TwoColumnLayout from '../layouts/TwoColumnLayout.jsx';
import SideMenu from '../layouts/SideMenu.jsx';
import RightAds from '../layouts/RightAds.jsx';
import useToolCore from '../hooks/useToolCore.js';
import { canonicalId } from '../utils/ids.js';

export default function Characters() {
  const { characterList } = useToolCore();

  // ▼ 絞り込みのローカル状態
  const [rarity, setRarity] = useState(''); // ''=すべて
  const [ctype, setCtype] = useState('');  // ''=すべて

  // ▼ 選択肢（重複排除して自動生成）
  const { rarityOptions, typeOptions } = useMemo(() => {
    const list = Array.isArray(characterList) ? characterList : [];
    const rset = new Set();
    const tset = new Set();
    for (const c of list) {
      if (c.rarity) rset.add(String(c.rarity));
      if (c.type) tset.add(String(c.type));
    }
    // レアリティは数値昇順、タイプは文字列昇順
    const rarityOptions = Array.from(rset).sort((a, b) => Number(a) - Number(b));
    const typeOptions = Array.from(tset).sort((a, b) => a.localeCompare(b, 'ja'));
    return { rarityOptions, typeOptions };
  }, [characterList]);

  // ✅ 並び順は ID の昇順（まず全体を整列 → 絞り込み）
  const itemsAllSorted = useMemo(() => {
    const list = Array.isArray(characterList) ? characterList : [];
    return [...list].sort((a, b) => {
      const aid = canonicalId(a.id || '');
      const bid = canonicalId(b.id || '');
      return aid.localeCompare(bid);
    });
  }, [characterList]);

  // ▼ 絞り込み適用後の配列
  const items = useMemo(() => {
    return itemsAllSorted.filter((c) => {
      const okR = rarity ? String(c.rarity) === rarity : true;
      const okT = ctype ? String(c.type) === ctype : true;
      return okR && okT;
    });
  }, [itemsAllSorted, rarity, ctype]);

  // ▼ 既存の見た目（インラインCSS）
  const ulStyle = { display: 'flex', flexWrap: 'wrap', gap: '5px', listStyle: 'none', padding: 0 };
  const liStyleBase = {
    border: '2px solid #ccc',
    borderRadius: '8px',
    padding: '2px',
    cursor: 'pointer',
    width: '106px',
    textAlign: 'center',
    opacity: 1,
    backgroundColor: 'white',
    color: '#000',
  };
  const imgStyle = { width: '100%', height: 'auto', borderRadius: '4px' };
  const nameStyle = { fontSize: '10px' };
  const linkStyle = { display: 'block', color: 'inherit', textDecoration: 'none' };

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="p-4">
        <h1 className="text-xl font-bold mb-2">全キャラクター一覧</h1>

        {/* ▼ フィルタUI */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-sm">レアリティ</span></label>
            <select
              className="select select-bordered select-sm w-40"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            >
              <option value="">すべて</option>
              {rarityOptions.map((r) => (
                <option key={r} value={r}>★{r}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-sm">タイプ</span></label>
            <select
              className="select select-bordered select-sm w-40"
              value={ctype}
              onChange={(e) => setCtype(e.target.value)}
            >
              <option value="">すべて</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {(rarity || ctype) && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setRarity(''); setCtype(''); }}
              title="フィルタをクリア"
            >
              クリア
            </button>
          )}

          <div className="ml-auto text-sm opacity-70">
            {items.length} 件 / 全 {itemsAllSorted.length} 件
          </div>
        </div>

        {/* ▼ ページ説明（機能説明ではなく “一覧の説明”） */}
        <p className="text-sm opacity-70 mb-4 leading-relaxed">
          ★3以上のキャラクターの一覧です。<br />キャラごとの発動数の多いチーム編成や、組み合わせを確認できます。
        </p>

        <ul style={ulStyle}>
          {items.map((c) => {
            const id = canonicalId(c.id);
            const name = c.name || id;
            const r = c.rarity ? `★${c.rarity}` : '';
            const t = c.type || '';
            return (
              <li key={id} title="" style={liStyleBase}>
                <Link to={`/character/${id}`} title={name} style={linkStyle}>
                  <img
                    alt={name}
                    src={`/images/${id}.png`}
                    style={imgStyle}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/placeholder.png';
                    }}
                  />
                  {/* ある場合だけ小さく表示（UIノイズにならない程度） */}
                  {(r || t) && (
                    <div style={{ fontSize: '10px', lineHeight: 1.2, marginTop: 2, opacity: 0.8 }}>
                      {r}{r && t ? ' ' : ''}{t}
                    </div>
                  )}
                  <div style={nameStyle}>{name}</div>
                </Link>
              </li>
            );
          })}
        </ul>

        {items.length === 0 && (
          <div className="text-sm opacity-70">条件に一致するキャラクターが見つかりませんでした。</div>
        )}
      </section>
    </TwoColumnLayout>
  );
}
