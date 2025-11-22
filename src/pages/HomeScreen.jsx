// src/pages/HomeScreen.jsx
import React from "react";
import SideMenu from "@/layouts/SideMenu.jsx";

function HomeScreen() {
  const background = "/images/bg3.jpg";
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="relative min-h-[100dvh] text-white overflow-hidden font-sans">
      {/* 背景 */}
      <BackgroundLayer src={background} />

      {/* ヘッダー */}
      <Header onOpenMenu={() => setIsMenuOpen(true)} />

      {/* フッター */}
      <Footer />

      {/* メイン */}
      <main
        className="relative"
        style={{
          paddingTop: "calc(56px + env(safe-area-inset-top, 0px))",
          paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="relative h-[calc(100dvh-56px-72px)]">
          <LeftRail />
          <RightRail />
          <CenterBlock />
        </div>
      </main>

      {/* ハンバーガーメニュー（PC/スマホ共通） */}
      <div className="fixed inset-0 z-[80] pointer-events-none">
        {/* オーバーレイ（フェード） */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        {/* 左からスライドインするメニュー本体 */}
        <aside
          className={`relative z-[90] h-full w-72 bg-base-200 border-r border-base-300 transform transition-transform duration-200 pointer-events-auto ${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <a href="/">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300">
              <img src="/images/icon.png" alt="icon" width={100} height={100} />
              <span className="font-semibold text-base-content">PWC EGOIST</span>
            </div>
          </a>
          <nav className="menu p-4 text-base-content">
            <SideMenu />
          </nav>
        </aside>
      </div>
    </div>
  );
}

/* ───────── 背景 ───────── */

function BackgroundLayer({ src }) {
  return (
    <div className="absolute inset-0 -z-10">
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

/* ───────── 正方形ボタン ───────── */

function SquareIconButton({ icon, label, imageSrc, onClick }) {
  return (
    <button
      type="button"
      className="w-16 h-16 rounded-xl bg-[#285e8c]/80 text-white flex flex-col items-center justify-center shadow-md"
      onClick={onClick}
    >
      {imageSrc ? (
        <img src={imageSrc} alt="" className="w-8 h-8 object-contain" />
      ) : (
        <span className="text-xl">{icon}</span>
      )}
      <span className="text-[9px]">{label}</span>
    </button>
  );
}

/* ───────── ヘッダー ───────── */

function Header({ onOpenMenu }) {
  return (
    <header
      className="fixed inset-x-0 z-50"
      style={{ paddingTop: "env(safe-area-inset-top,0px)" }}
    >
      <div className="mt-2 h-[56px] flex items-center px-2 gap-2">
        {/* 1: メニュー（ハンバーガー） */}
        <SquareIconButton icon="☰" label="メニュー" onClick={onOpenMenu} />

        {/* 2: ロゴ（背景なし・角丸・64px） */}
        <button
          type="button"
          data-no="2"
          className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
        >
          <img
            src="/images/icon.png"
            alt="PWCロゴ"
            className="w-16 h-16 object-contain"
          />
        </button>

        {/* 右側：ジェム / 総戦力 / X */}
        <div className="ml-auto flex items-center gap-2">
          {/* 3/4: ジェム・総戦力（縦30px × 横64px / 間4px） */}
          <div className="flex flex-col gap-[4px]">
            <div className="w-16 h-[30px] flex items-center justify-center rounded-full bg-[#285e8c]/80 border border-white/30 text-[11px]">
              ジェム
            </div>
            <div className="w-16 h-[30px] flex items-center justify-center rounded-full bg-[#285e8c]/80 border border-white/30 text-[11px]">
              総戦力
            </div>
          </div>

          {/* 5: X共有（64px × 64px） */}
          <button
            type="button"
            className="w-16 h-16 rounded-xl bg-[#285e8c]/80 border border-white/20 flex items-center justify-center shadow-md"
            data-no="5"
          >
            <span className="text-2xl leading-none">𝕏</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ───────── フッター ───────── */

function Footer() {
  return (
    <footer
      className="fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}
    >
      <div className="h-[72px] flex items-center px-2">
        <div className="w-full grid grid-cols-5 gap-2">
          <FooterTab icon="🏠" label="ホーム" active href="/" />
          <FooterTab icon="👥" label="チーム" href="/tool" />
          <FooterTab icon="👤" label="キャラ" href="/characters" />
          <FooterTab icon="⚡" label="マッチ" href="/skills" />
          <FooterTab
            icon="🛒"
            label="ショップ"
            future
            href="/support-amazon"
          />
        </div>
      </div>
    </footer>
  );
}

function FooterTab({ icon, label, active, future, href }) {
  const base =
    "flex items-center justify-center h-12 rounded-xl px-2 gap-1 whitespace-nowrap text-[10px]";
  const style = future
    ? "bg-white/20 text-white/50 border border-white/30"
    : active
    ? "bg-emerald-400/90 text-black font-semibold"
    : "bg-[#285e8c]/80 border border-white/20 text-white";

  return (
    <a href={href} className={`${base} ${style}`}>
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

/* ───────── 左サイドレール ───────── */

function LeftRail() {
  return (
    <aside className="absolute inset-y-0 left-2 pt-16 flex flex-col gap-2">
      <SquareIconButton icon="📋" label="ミッション" />
      <SquareIconButton icon="👥" label="コミュニティ" />
      <SquareIconButton icon="⭐" label="注目の選手" />
    </aside>
  );
}

/* ───────── 右サイドレール ───────── */

function RightRail() {
  return (
    <aside className="absolute inset-y-0 right-2 pt-16 flex flex-col gap-2">
      <SquareIconButton icon="ℹ️" label="お知らせ" />
      <SquareIconButton icon="🎁" label="プレゼント" />
      <SquareIconButton icon="💸" label="SALE" />
      <SquareIconButton icon="🎫" label="PASS" />
    </aside>
  );
}

/* ───────── 中央コンテンツ ───────── */

function CenterBlock() {
  return (
    <section className="relative h-full flex items-end justify-center pb-6">
      <div className="w-full max-w-[720px] px-2">
        <div className="flex gap-3">
          {/* 左カラム：13,15,17,18 */}
          <div className="flex-1 flex flex-col gap-2">
            <ModeCard title="ランキング" />
            <ModeCard title="リーグマッチ（大会）" />
            <ModeCard title="リーグマッチ（シーズン）" />
            <ModeCard title="イベント（スライド）" />
          </div>

          {/* 右カラム：14,16,19,20 */}
          <div className="flex-1 flex flex-col gap-2">
            <ModeCard title="ご支援バナー" />
            <ModeCard title="トレーニング" />
            <ModeCard title="ランクマッチ" />
            <ModeCard title="ライバルリーバトル" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeCard({ title }) {
  return (
    <button
      type="button"
      className="h-12 rounded-xl px-4 flex items-center bg-[#285e8c]/80 border border-white/30 text-[11px] shadow-md text-white"
    >
      {title}
    </button>
  );
}

export default HomeScreen;
