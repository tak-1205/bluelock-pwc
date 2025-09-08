// src/layouts/TwoColumnLayout.jsx
import React from "react";

/**
 * 3カラム共通レイアウト（daisyUI docs /components/card と同構成）
 * - 左: drawer-side（sidebar）… LG以上は常時表示、モバイルはハンバーガーで開閉
 * - 中央: children（本文）
 * - 右: right（広告など。省略可、指定時は xl 以上で表示＆ sticky）
 *
 * 使い方:
 * <TwoColumnLayout sidebar={<MyMenu/>} right={<MyAds/>}>
 *   <PageContent/>
 * </TwoColumnLayout>
 */
export default function TwoColumnLayout({
  sidebar,
  children,
  right = null,
  // 一番外側はご指定どおり
  containerClass = "bg-base-100 drawer mx-auto max-w-[100rem] lg:drawer-open",
  // 追従の上オフセット（例: "top-4", "top-16"）
  stickyTopClass = "top-4",
  // drawer のトグルID（重複防止用にページごとで変えてもOK）
  drawerId = "app-drawer",
  // モバイル上部バーのタイトル
  mobileTitle = "ブルーロックPWC",
}) {
  const hasRight = Boolean(right);

  return (
    <div className={containerClass}>
      {/* ===== Drawer toggle（左メニュー開閉） ===== */}
      <input id={drawerId} type="checkbox" className="drawer-toggle" />

      {/* ====== 中央 + 右（本文＆追従広告） ====== */}
      <div className="drawer-content overflow-visible">
        {/* モバイル：上部バー（ハンバーガー） */}
        <div className="navbar bg-base-100 border-b border-base-200 lg:hidden">
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
          <div className="flex-1 px-2">{mobileTitle}</div>
        </div>

        {/* コンテンツ領域（中央＋右の2カラム） */}
        <div className="px-4 md:px-6 py-6">
          <div className={`grid gap-6 ${hasRight ? "xl:grid-cols-[minmax(0,1fr)_20rem]" : ""}`}>
            {/* ===== 中央：本文 ===== */}
            <main className="min-w-0">
              {children}
            </main>

            {/* ===== 右：追従広告（指定時のみ / xl以上で表示） ===== */}
            {hasRight && (
              <aside className={`hidden xl:block sticky ${stickyTopClass} self-start space-y-4`}>
                {right}
              </aside>
            )}
          </div>
        </div>
      </div>

      {/* ====== 左：メニュー（drawer-side） ====== */}
      <div className="drawer-side">
        <label htmlFor={drawerId} aria-label="close sidebar" className="drawer-overlay" />
        <aside className="min-h-full w-72 bg-base-200 border-r border-base-300">
          {/* ロゴ行（必要なければ削除OK） */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300">
            <img src="/images/icon.png" alt="icon" width={24} height={24} />
            <span className="font-semibold">ブルーロックPWC</span>
          </div>

          {/* メニュー本体：daisyUI menu（sidebar は断片を想定） */}
          <nav className="menu p-4">
            {sidebar}
          </nav>
        </aside>
      </div>
    </div>
  );
}
