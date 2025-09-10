// src/pages/Character.jsx
import { useLocation } from 'react-router-dom';
import TwoColumnLayout from '../layouts/TwoColumnLayout.jsx';
import SideMenu from '../layouts/SideMenu.jsx';
import RightAds from '../layouts/RightAds.jsx';
import { useCharacterPageData } from '../hooks/useCharacterPageData.js';

export default function Character() {
  const { character, combosTop, isLoading } = useCharacterPageData();
  const { pathname } = useLocation();

  if (isLoading) return <div className="p-6">Loading...</div>;

  if (!character) {
    return (
      <div className="p-6">
        キャラが見つかりません（path: <code>{pathname}</code>）
      </div>
    );
  }

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="p-4 space-y-6">
        {/* ヘッダー */}
        <header className="flex items-center gap-4">
          <img
            src={`/images/${String(character.id || '').toLowerCase()}.png`}
            alt={character.name}
            className="w-16 h-16 rounded-full ring ring-primary"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div>
            <h1 className="text-xl font-bold">{character.name}</h1>
            <p className="text-sm opacity-70">{character.id}</p>
          </div>
        </header>

        {/* 発動数の多い組み合わせランキング */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">このキャラを含む発動組み合わせ（多い順）</h2>
          <ul className="space-y-2">
            {combosTop.map((row) => (
              <li key={row.key} className="card bg-base-100 shadow-sm p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {row.members.map((id) => (
                    <img
                      key={id}
                      src={`/images/${id.toLowerCase()}.png`}
                      alt={id}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ))}
                </div>
                <div className="text-sm opacity-70">発動数：{row.count}</div>
                <a href={row.shareUrl} className="btn btn-sm btn-primary">この5人で見る</a>
              </li>
            ))}
            {combosTop.length === 0 && (
              <li className="text-sm opacity-70">該当する組み合わせが見つかりませんでした。</li>
            )}
          </ul>
        </div>
      </section>
    </TwoColumnLayout>
  );
}
