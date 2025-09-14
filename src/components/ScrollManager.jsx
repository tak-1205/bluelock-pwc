// src/components/ScrollManager.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const location = useLocation();

  // ブラウザのスクロール復元を無効化
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const prev = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => (window.history.scrollRestoration = prev);
    }
  }, []);

  // パス or クエリが変わったらページ最上部へ
  useEffect(() => {
    // iOS Safari 対策で rAF 後に実行
    requestAnimationFrame(() => {
      // 1) レイアウトのスクロールコンテナ（drawer コンテンツ）
      const scroller =
        document.querySelector(".drawer-content") ||
        document.scrollingElement ||
        document.documentElement;
      if (scroller) scroller.scrollTop = 0;

      // 2) 念のため window も
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }, [location.pathname, location.search]); // ハッシュ(#)遷移は対象外

  return null;
}
