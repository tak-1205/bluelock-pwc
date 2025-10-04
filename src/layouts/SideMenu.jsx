// src/layouts/SideMenu.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import characterList from "../data/characterList.js";
import { getProfileByRootId, rootIdOf } from "../utils/profile.js";

export default function SideMenu({ prepend = null, append = null, children = null }) {
  const liClass = "whitespace-nowrap";

  const Pending = ({ label }) => (
    <div
      className="flex items-center gap-2 text-base-content/60 opacity-60 cursor-not-allowed select-none pointer-events-none"
      aria-disabled="true"
      role="note"
    >
      <span>{label}</span>
      <span className="badge badge-ghost badge-sm">準備中</span>
    </div>
  );

  // 親ページ用の一覧（rootIdごとに1件）
  const roots = React.useMemo(() => {
    const set = new Set((characterList || []).map(c => rootIdOf(c.id)));
    return Array.from(set)
      .sort()
      .map(r => {
        const prof = getProfileByRootId(r);
        return { rootId: r, label: prof?.name || r };
      });
  }, []);

  // プルダウン開閉（details/summaryは使わない）
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <h2 className="menu-title px-4 pt-4">メニュー</h2>
      <ul className="menu px-2 pb-2">
        {prepend}

        <li className={liClass}>
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
        </li>

        <li className={liClass}>
          <NavLink to="/tool" className={({ isActive }) => (isActive ? "active" : "")}>
            チーム編成作成ツール
          </NavLink>
        </li>

        {/* 「キャラ別一覧」リンク + 右側に開閉ボタン（クリック領域を分離） */}
        <li className={liClass}>
          <div className="flex items-center gap-2">
            <NavLink
              to="/characters"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              キャラ別一覧
            </NavLink>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="character-root-dropdown"
              className="ml-auto btn btn-ghost btn-xs shrink-0"
              onClick={() => setOpen(v => !v)}
            >
              {open ? "▾" : "▸"}
            </button>
          </div>

          {open && (
            <div
              id="character-root-dropdown"
              className="mt-1 rounded-md border border-base-300 max-h-72 overflow-auto"
            >
              {/* ← .menu を使わず縦並びを強制 */}
              <ul className="p-1 flex flex-col gap-1">
                {roots.map(it => (
                  <li key={it.rootId}>
                    <NavLink
                      to={`/characters/${it.rootId}`}
                      className="block px-3 py-2 hover:bg-base-200 rounded"
                    >
                      {it.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>

        <li className={liClass}>
          <Pending label="人気チーム編成ランキング" />
        </li>
        <li className={liClass}>
          <Pending label="発動トレーニングスキル" />
        </li>

        {children}
        {append}
      </ul>
    </>
  );
}
