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
import CharacterRoot from "./pages/CharacterRoot.jsx";
import Training from "./pages/TrainingTool.jsx";
import SupportAmazon from "./pages/SupportAmazon.jsx";
import MatchSkillsIndex from "@/pages/MatchSkillsIndex.jsx";

export default function App() {
  useLazyGA(import.meta.env.VITE_GA_MEASUREMENT_ID);

  const { pathname } = useLocation();
  const rawPath = (pathname || "/").replace(/\/+$/, "") || "/";
  const path = rawPath;                // そのまま（/characters の slug は大小維持）
  const pathLower = rawPath.toLowerCase(); // 固定パスの判定/正規化にのみ使用

  // --- 固定パスの大文字混在を正規化（/Training → /training など）---
  if (
    /^\/(tool|training|privacy|ranking|contact)$/.test(pathLower) &&
    path !== pathLower
  ) {
    window.location.replace(pathLower);
    return null;
  }

  // --- /characters 系（大小そのまま扱う）---
  if (path === "/characters") return <Characters />;
  if (path.startsWith("/characters/")) {
    const slug = path.slice("/characters/".length); // 例: "B001"
    const isRoot = /^[A-Z]\d{3}$/i.test(slug);
    return isRoot ? <CharacterRoot rootId={slug} /> : <Characters />;
  }

  // --- /character 系（大小そのまま扱う）---
  if (path === "/character") return <Character />;

  if (path.startsWith("/character/")) {
    const slug = path.slice("/character/".length); // 例: "B001" or "B001-03"
    const isRoot = /^[A-Z]\d{3}$/i.test(slug);

    if (isRoot) {
      // rootIdの場合は /characters/B001 にリダイレクト
      window.location.replace(`/characters/${slug}`);
      return null;
    }
    return <Character />;
  }

  // --- 既存の早期return群：トップ/他ページ（小文字で判定）---
  let Page = Tool; // 既定は従来通り Tool
  if (pathLower === "/privacy") Page = Privacy;
  else if (pathLower === "/ranking") Page = Ranking;
  else if (pathLower === "/") Page = Home;
  else if (pathLower === "/tool") Page = Tool;
  else if (pathLower === "/training") Page = Training;
  else if (pathLower === "/contact") Page = Contact;
  else if (pathLower === "/support-amazon") Page = SupportAmazon;
  else if (pathLower === "/skills") Page = MatchSkillsIndex;

  return (
    <>
      <ScrollManager />
      <Page />
    </>
  );
}
