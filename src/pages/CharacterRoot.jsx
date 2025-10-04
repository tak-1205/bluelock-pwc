// src/pages/CharacterRoot.jsx
import React from "react";
import { Link } from "react-router-dom";
import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";
import characterList from "../data/characterList.js";
import { getProfileByRootId, rootIdOf } from "../utils/profile.js";
import { canonicalId } from "../utils/ids.js";

function Img({ id, alt }) {
  const [err, setErr] = React.useState(false);
  const src = err ? "/images/placeholder.png" : `/images/${id}.png`;
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

export default function CharacterRoot({ rootId }) {
  const profile = getProfileByRootId(rootId);

  const versions = React.useMemo(() => {
    const list = (characterList || []).filter((c) => rootIdOf(c.id) === rootId);
    return list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }, [rootId]);

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="p-4 max-w-5xl mx-auto space-y-8">
        {/* 見出し */}
        <div className="flex items-center gap-3">
          <img src="/images/icon.png" alt="icon" width={24} height={24} />
          <h1 className="text-2xl font-bold">{profile?.name || rootId}</h1>
        </div>

        {/* プロフィール */}
        {profile ? (
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
        ) : (
          <p className="text-sm opacity-70">プロフィール情報が見つかりません。</p>
        )}

        {/* バージョン一覧 */}
        <section>
          <h2 className="text-xl font-semibold mb-4">バージョン一覧</h2>
          {versions.length === 0 ? (
            <p className="opacity-70">このキャラのバージョン情報がありません。</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {versions.map((v) => {
                const cid = canonicalId(v.id || "");
                const title = v.name || v.title || cid;
                return (
                  <Link
                    key={cid}
                    to={`/character/${cid}`}
                    className="card bg-base-100 hover:shadow-md transition-shadow"
                  >
                    <div className="card-body items-center text-center gap-3">
                      <Img id={cid} alt={title} />
                      <div>
                        <div className="font-semibold text-sm">{cid}</div>
                        <div className="text-xs opacity-80 line-clamp-2">{title}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </TwoColumnLayout>
  );
}
