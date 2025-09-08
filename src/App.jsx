// src/App.jsx
import React from "react";
import { useLocation } from "react-router-dom";

// ページ
import Home from "./pages/Home.jsx";
import Privacy from "./pages/Privacy.jsx";
import Ranking from "./pages/Ranking.jsx";
import Tool from "./pages/Tool.jsx"; // ← 新規追加

export default function App() {
  const location = useLocation();
  const path = (location.pathname || "/").replace(/\/+$/, "") || "/";

  if (path === "/privacy") return <Privacy />;
  if (path === "/ranking") return <Ranking />;
  if (path === "/") return <Home />;
  if (path === "/tool") return <Tool />;

  // それ以外のパスに来たら /tool を表示（従来の挙動が「その他→ツール本体」の場合）
  return <Tool />;
}
