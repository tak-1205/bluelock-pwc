// src/pages/HomeScreen.jsx
import React from "react";
import SideMenu from "@/layouts/SideMenu.jsx";
import HomeHeader from "@/layouts/HomeHeader.jsx";
import HomeFooter from "@/layouts/HomeFooter.jsx";

// ここに「一旦非表示にしたい番号」を書く
// 例: 14 と 19 を非表示 → new Set([14, 19])
const HIDDEN_NUMBERS = new Set([3, 4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 25]);

function Slot({ no, children }) {
  const key = Number(no); // 文字列でも確実に判定できるように
  if (HIDDEN_NUMBERS.has(key)) return null;
  return <>{children}</>;
}

function HomeScreen() {
  const BACKGROUNDS = [
    "/images/bg/char-bg1.png",
    "/images/bg/char-bg2.png",
  ];

  const [bgIndex, setBgIndex] = React.useState(0);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const hasMultiple = BACKGROUNDS.length > 1;

  // 自動スライド（2枚以上のときのみ）
  React.useEffect(() => {
    if (!hasMultiple) return;

    const id = window.setInterval(() => {
      setBgIndex((i) => (i + 1) % BACKGROUNDS.length);
    }, 6000);

    return () => window.clearInterval(id);
  }, [hasMultiple, BACKGROUNDS.length]);

  // 手動スライド
  const slidePrev = () => {
    if (!hasMultiple) return;
    setBgIndex((i) => (i - 1 + BACKGROUNDS.length) % BACKGROUNDS.length);
  };

  const slideNext = () => {
    if (!hasMultiple) return;
    setBgIndex((i) => (i + 1) % BACKGROUNDS.length);
  };

  return (
    <div className="relative min-h-[100dvh] text-white overflow-hidden font-sans">
      {/* 背景 */}
      <BackgroundLayer
        srcList={BACKGROUNDS}
        index={bgIndex}
        onPrev={slidePrev}
        onNext={slideNext}
      />

      {/* ヘッダー */}
      <HomeHeader
        Slot={Slot}
        onOpenMenu={() => setIsMenuOpen(true)}
        SquareIconButton={SquareIconButton}
      />

      {/* フッター */}
      <HomeFooter Slot={Slot} />

      {/* メイン */}
      <main
        className="relative z-10"
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
    </div>
  );
}

function BackgroundLayer({ srcList, index, onPrev, onNext }) {
  const hasMultiple = srcList.length > 1;

  const startXRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);

  const THRESHOLD_PX = 50; // これ以上動いたらスワイプ判定

  const onPointerDown = (e) => {
    if (!hasMultiple) return;
    // 左クリック or タッチのみ
    if (e.pointerType === "mouse" && e.button !== 0) return;

    isDraggingRef.current = true;
    startXRef.current = e.clientX;

    // 途中で pointer が外れても拾えるように
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerUp = (e) => {
    if (!hasMultiple) return;
    if (!isDraggingRef.current) return;

    const startX = startXRef.current;
    const dx = startX == null ? 0 : e.clientX - startX;

    isDraggingRef.current = false;
    startXRef.current = null;

    if (Math.abs(dx) < THRESHOLD_PX) return;

    // 右にドラッグ → 前へ（好みで逆でもOK）
    if (dx > 0) onPrev?.();
    else onNext?.();
  };

  const onPointerCancel = () => {
    isDraggingRef.current = false;
    startXRef.current = null;
  };

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* 背景画像 */}
      {srcList.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={[
            "absolute inset-0 w-full h-full object-cover",
            "transition-opacity duration-1000",
            i === index ? "opacity-100" : "opacity-0",
          ].join(" ")}
          draggable={false}
        />
      ))}

      {/* スワイプ判定用の透明レイヤー（ヘッダー/フッターを邪魔しない） */}
      {hasMultiple && (
        <div
          className="absolute left-0 right-0"
          style={{ 
            top: "calc(56px + env(safe-area-inset-top,0px))", 
            bottom: "calc(72px + env(safe-area-inset-bottom,0px))", 
            touchAction:"pan-y", userSelect:"none" 
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
      )}
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

/* ───────── 左サイドレール ───────── */

function LeftRail() {
  return (
    <aside className="absolute inset-y-0 left-2 pt-16 flex flex-col gap-2">
      <Slot no={6}>
        <SquareIconButton icon="📋" label="ミッション" />
      </Slot>
      <Slot no={7}>
        <SquareIconButton icon="👥" label="コミュニティ" />
      </Slot>
      <Slot no={8}>
        <SquareIconButton icon="⭐" label="注目の選手" />
      </Slot>
    </aside>
  );
}

/* ───────── 右サイドレール ───────── */

function RightRail() {
  return (
    <aside className="absolute inset-y-0 right-2 pt-16 flex flex-col gap-2">
      <Slot no={9}>
        <SquareIconButton icon="ℹ️" label="お知らせ" />
      </Slot>
      <Slot no={10}>
        <SquareIconButton icon="🎁" label="プレゼント" />
      </Slot>
      <Slot no={11}>
        <SquareIconButton icon="💸" label="SALE" />
      </Slot>
      <Slot no={12}>
        <SquareIconButton icon="🎫" label="PASS" />
      </Slot>
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
            <Slot no={13}>
              <ModeCard title="ランキング" />
            </Slot>
            <Slot no={15}>
              <ModeCard title="リーグマッチ（大会）" />
            </Slot>
            <Slot no={17}>
              <ModeCard title="リーグマッチ（シーズン）" />
            </Slot>
            <Slot no={18}>
              <ModeCard title="イベント（スライド）" />
            </Slot>
          </div>

          {/* 右カラム：14,16,19,20 */}
          <div className="flex-1 flex flex-col gap-2">
            <Slot no={14}>
              <ModeCard title="ご支援バナー" />
            </Slot>
            <Slot no={16}>
              <ModeCard title="トレーニング" />
            </Slot>
            <Slot no={19}>
              <ModeCard title="ランクマッチ" />
            </Slot>
            <Slot no={20}>
              <ModeCard title="ライバルリーバトル" />
            </Slot>
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
