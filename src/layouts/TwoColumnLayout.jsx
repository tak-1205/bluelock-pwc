// src/layouts/TwoColumnLayout.jsx
import React from "react";
import SiteFooter from "./SiteFooter.jsx";
import SupportAmazonBanner from "@/components/SupportAmazonBanner.jsx";

export default function TwoColumnLayout({
  sidebar,
  children,
  right = null,
  containerClass = "bg-base-100 drawer mx-auto max-w-[100rem] lg:drawer-open",
  stickyTopClass = "top-4",
  drawerId = "app-drawer",
  // ↓ 既存：文字のタイトルは残すが、デフォルトは PWC EGOIST に
  mobileTitle = "PWC EGOIST",
  // ↓ 追加：任意でロゴ行を差し替えたい場合に使える（未指定なら既定のロゴ＋テキスト）
  mobileBrand = null,
}) {
    // 右カラムの全体キルスイッチ（envでOFFなら列ごと作らない）
    const RIGHT_ENABLED = (import.meta.env.VITE_FEATURE_RIGHT ?? "on") === "on";
    const hasRight = RIGHT_ENABLED && Boolean(right);

  return (
    <div className={containerClass}>
      <input id={drawerId} type="checkbox" className="drawer-toggle" />

      <div className="drawer-content overflow-visible">
        {/* モバイル：上部バー（ハンバーガー + ブランド） */}
        <div
          className="navbar sticky top-0 z-30 lg:hidden bg-base-100/90 backdrop-blur border-b border-base-200 shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}  // iOSノッチ対策
        >
          <div className="flex-none">
            <label
              htmlFor={drawerId}
              className="btn btn-ghost btn-square"
              aria-label="open sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>

          <div className="flex-1">
            {mobileBrand ? (
              mobileBrand
            ) : (
              <a href="/">
                <div className="flex items-center gap-2">
                  <img
                  src="/images/icon.png"
                  alt="icon"
                  width={64}
                  height={64}
                  className="block h-auto w-[64px] max-w-[64px]"
                />
                  <span className="font-semibold">{mobileTitle}</span>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* コンテンツ領域（中央＋右の2カラム） */}
        <div className="px-4 md:px-6 py-6">
          <div className={`grid gap-6 ${hasRight ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
           <main className="min-w-0">
             {children}
             {/* 全ページ共通：Amazon投げ銭バナー（環境変数でON/OFF） */}
             {(import.meta.env.VITE_FEATURE_SUPPORT_BANNER ?? "on") === "on" && (
               <SupportAmazonBanner />
             )}
             {hasRight && (
               // モバイル/タブレット：本文の下にインライン表示 
               <div className={`mt-6 xl:hidden`}>
                 {right}
               </div>
             )}
           </main>

           {hasRight && (
             // デスクトップ：右レール表示（従来） 
             <aside className={`hidden xl:block sticky ${stickyTopClass} self-start space-y-4`}>
               {right}
             </aside>
           )}
         </div>
        </div>

        {/* 共通フッター（全体幅） */}
        <SiteFooter />
      </div>

      {/* 左：メニュー（drawer-side）—ここはそのまま。統一したい場合は同様に PWC EGOIST に変更可 */}
      <div className="drawer-side z-[60]">
        <label htmlFor={drawerId} aria-label="close sidebar" className="drawer-overlay z-[70]" />
        <aside className="min-h-full w-72 bg-base-200 border-r border-base-300 relative z-[80]">
            <a href="/">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300">
                    <img src="/images/icon.png" alt="icon" width={100} height={100} />
                    <span className="font-semibold">PWC EGOIST</span> 
                </div>
            </a>
          <nav className="menu p-4">{sidebar}</nav>
        </aside>
      </div>
    </div>
  );
}
