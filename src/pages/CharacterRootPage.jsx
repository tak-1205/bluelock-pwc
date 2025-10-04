import React from "react";
import characterList from "@/data/characterList.json"; // 既存
import { getProfileByRootId, rootIdOf } from "@/utils/profile.js";
import { Link, useLocation } from "react-router-dom";

// 画像フォールバック（存在しない場合は共通no-imageへ）
function Img({ id, alt }) {
  const [err, setErr] = React.useState(false);
  const src = err ? "/images/no-image.png" : `/images/characters/${id}.png`;
  return (
    <img
      src={src}
      alt={alt}
      width={96}
      height={96}
      className="w-24 h-24 object-cover rounded-2xl"
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function CharacterRootPage({ rootId }) {
  // プロフィール取得
  const profile = getProfileByRootId(rootId);

  // ルートに紐づく全バージョンを抽出（idが "B001-xx" のもの）
  const versions = React.useMemo(() => {
    const list = (characterList || []).filter(c => rootIdOf(c.id) === rootId);
    // id昇順で安定
    return list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [rootId]);

  if (!profile && versions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-2">キャラ情報が見つかりません</h1>
        <p className="text-sm opacity-80">rootId: {rootId}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      {/* 見出し */}
      <div className="flex items-center gap-3">
        <img src="/images/icon.png" alt="icon" width={24} height={24} />
        <h1 className="text-2xl font-bold">{profile?.name || rootId}</h1>
      </div>

      {/* プロフィール（固定） */}
      {profile && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">プロフィール</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <table className="table table-zebra">
                <tbody>
                  <tr><th className="w-32">名前</th><td>{profile.name}</td></tr>
                  <tr><th>名前（英）</th><td>{profile.nameEn}</td></tr>
                  <tr><th>CV</th><td>{profile.cv}</td></tr>
                  <tr><th>誕生日</th><td>{profile.birthdayText}</td></tr>
                  <tr><th>身長</th><td>{profile.height}</td></tr>
                </tbody>
              </table>
              <div className="prose max-w-none">
                <h3 className="text-base font-semibold mb-2">紹介文</h3>
                <p className="leading-relaxed">{profile.intro}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* バージョン一覧（カード） */}
      <section>
        <h2 className="text-xl font-semibold mb-4">バージョン一覧</h2>
        {versions.length === 0 ? (
          <p className="opacity-70">このキャラのバージョン情報がありません。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {versions.map(v => (
              <Link key={v.id} to={`/character/${v.id}`} className="card bg-base-100 hover:shadow-md transition-shadow">
                <div className="card-body items-center text-center gap-3">
                  <Img id={v.id} alt={v.id} />
                  <div>
                    <div className="font-semibold text-sm">{v.id}</div>
                    {v.title ? (
                      <div className="text-xs opacity-80 line-clamp-2">{v.title}</div>
                    ) : (
                      <div className="text-xs opacity-50">（タイトル未設定）</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
