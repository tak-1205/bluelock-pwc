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
import CharacterRoot from "./pages/CharacterRoot.jsx"; // 親ページ

export default function App() {
  useLazyGA(import.meta.env.VITE_GA_MEASUREMENT_ID);

  const { pathname } = useLocation();
  const path = (pathname || "/").replace(/\/+$/, "") || "/";

  // --- /characters 系 ---
  if (path === "/characters") return <Characters />;
  if (path.startsWith("/characters/")) {
    const slug = path.slice("/characters/".length); // 例: "B001"
    const isRoot = /^[A-Z]\d{3}$/i.test(slug);
    return isRoot ? <CharacterRoot rootId={slug} /> : <Characters />;
  }

  // --- /character 系 ---
  // /character 単体は従来どおりバージョン別ページにフォールバック
  if (path === "/character") return <Character />;

  if (path.startsWith("/character/")) {
    const slug = path.slice("/character/".length); // 例: "B001" or "B001-03"
    const isRoot = /^[A-Z]\d{3}$/i.test(slug);

    if (isRoot) {
      // rootIdの場合は /characters/B001 にリダイレクト
      window.location.replace(`/characters/${slug}`);
      return null; // レンダリングは不要
    }

    // それ以外（B001-03など）はバージョンページ
    return <Character />;
  }

  // 既存の早期return群：トップ/他ページ
  let Page = Tool;
  if (path === "/privacy") Page = Privacy;
  else if (path === "/ranking") Page = Ranking;
  else if (path === "/") Page = Home;
  else if (path === "/tool") Page = Tool;
  else if (path === "/contact") Page = Contact;

  return (
    <>
      <ScrollManager />
      <Page />
    </>
  );
}
