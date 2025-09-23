// src/layouts/SideMenu.jsx
import { NavLink, Link } from "react-router-dom";

export default function SideMenu({ prepend = null, append = null, children = null }) {
  const liClass = "whitespace-nowrap";

  // 準備中項目（非リンク・非フォーカス・クリック不可）
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

        {/* キャラ別一覧：公開化（/characters へ遷移） */}
        <li className={liClass}>
          <NavLink
            to="/characters"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            キャラ別一覧
          </NavLink>
        </li>

        {/* 準備中（非リンク表示） */}
        <li className={liClass}>
          <Pending label="人気チーム編成ランキング" />
        </li>

        {children}
        {append}
      </ul>
    </>
  );
}
