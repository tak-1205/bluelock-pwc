import { NavLink, Link } from "react-router-dom";

/**
 * 共通サイドメニュー
 * - 既定の項目の前に挿入:  props.prepend
 * - 既定の項目の後ろに挿入: props.append
 * - さらに柔軟に: children（<li>...</li> をそのまま追記）
 *
 * 使い方:
 * <SideMenu append={<li><Link to="/new">新ページ</Link></li>} />
 * <SideMenu><li><Link to="/help">ヘルプ</Link></li></SideMenu>
 */
export default function SideMenu({ prepend = null, append = null, children = null }) {
  const liClass = "whitespace-nowrap"; // 長文回避用（必要に応じて調整）

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
            マッチスキル抽出
          </NavLink>
        </li>
        {/* 
        <li className={liClass}>
          <NavLink to="/ranking" className={({ isActive }) => (isActive ? "active" : "")}>
            ランキング
          </NavLink>
        </li>
         */}
        
        {children}
        {append}
      </ul>
    </>
  );
}
