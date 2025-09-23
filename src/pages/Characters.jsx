// src/pages/Characters.jsx
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import TwoColumnLayout from '../layouts/TwoColumnLayout.jsx';
import SideMenu from '../layouts/SideMenu.jsx';
import RightAds from '../layouts/RightAds.jsx';
import useToolCore from '../hooks/useToolCore.js';
import { canonicalId } from '../utils/ids.js';

export default function Characters() {
  const { characterList } = useToolCore();

  // ✅ 並び順は ID の昇順
  const items = useMemo(() => {
    const list = Array.isArray(characterList) ? characterList : [];
    return [...list].sort((a, b) => {
      const aid = canonicalId(a.id || '');
      const bid = canonicalId(b.id || '');
      return aid.localeCompare(bid);
    });
  }, [characterList]);

  // ▼ CharacterSelector.jsx に合わせた見た目（インラインCSS）
  const ulStyle = { display: 'flex', flexWrap: 'wrap', gap: '5px', listStyle: 'none', padding: 0 };
  const liStyleBase = {
    border: '2px solid #ccc',
    borderRadius: '8px',
    padding: '2px',
    cursor: 'pointer',
    width: '75px',
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
        <h1 className="text-xl font-bold mb-4">全キャラクター一覧</h1>

        {/* ▼ ページ説明（機能説明ではなく “一覧の説明”） */}
        <p className="text-sm opacity-70 mb-4 leading-relaxed">
          ★3以上のキャラクターの一覧です。<br />キャラごとの発動数の多いチーム編成や、組み合わせを確認できます。
        </p>

        <ul style={ulStyle}>
          {items.map((c) => {
            const id = canonicalId(c.id);
            const name = c.name || id;
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
                  <div style={nameStyle}>{name}</div>
                </Link>
              </li>
            );
          })}
        </ul>

        {items.length === 0 && (
          <div className="text-sm opacity-70">キャラクターのデータが見つかりませんでした。</div>
        )}
      </section>
    </TwoColumnLayout>
  );
}
