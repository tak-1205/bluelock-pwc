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
import Character from "./pages/Character.jsx";
import Contact from "./pages/Contact.jsx";

export default function App() {
  useLazyGA(import.meta.env.VITE_GA_MEASUREMENT_ID); // ある場合のみ
  
  const location = useLocation();
  const path = (location.pathname || "/").replace(/\/+$/, "") || "/";

  let Page = Tool;
  if (path === "/character" || path.startsWith("/character/")) Page = Character;
  else if (path === "/privacy") Page = Privacy;
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
