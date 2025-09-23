// src/App.jsx
import React from "react";
import useLazyGA from "./hooks/useLazyGA.js";

import { useLocation } from "react-router-dom";
import ScrollManager from "./components/ScrollManager.jsx";

// ページ
import Home from "./pages/Home.jsx";
import Privacy from "./pages/Privacy.jsx";
import Ranking from "./pages/Ranking.jsx";
import Tool from "./pages/Tool.jsx";
import Contact from "./pages/Contact.jsx";
import Characters from "./pages/Characters.jsx";
import Character from "./pages/Character.jsx";

export default function App() {
  useLazyGA(import.meta.env.VITE_GA_MEASUREMENT_ID); // ある場合のみ

  // ✅ pathname を正しく取得
  const { pathname } = useLocation();
  // 末尾スラッシュ除去（/ → /, /foo/ → /foo）
  const path = (pathname || "/").replace(/\/+$/, "") || "/";

  // ✅ まず /characters を判定（/character に先に当たらないように）
  if (path === "/characters" || path.startsWith("/characters/")) return <Characters />;

  // ✅ 次に /character（個別）
  if (path === "/character" || path.startsWith("/character/")) return <Character />;

  // 既存の早期return群：トップ/他ページ
  let Page = Tool;
  if (path === "/privacy") Page = Privacy;
  else if (path === "/ranking") Page = Ranking;
  else if (path === "/") Page = Home;
  else if (path === "/tool") Page = Tool;
  else if (path === "/contact") Page = Contact;

  // ScrollManager を常に一緒に描画
  return (
    <>
      <ScrollManager />
      <Page />
    </>
  );
}
