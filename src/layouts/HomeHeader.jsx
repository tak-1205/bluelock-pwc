// src/layouts/HomeHeader.jsx
import React from "react";

/**
 * HomeScreen用 Header
 * - Slot + HIDDEN_NUMBERS は親(HomeScreen)から渡す（正準仕様の一元管理）
 */
export default function HomeHeader({
  Slot,
  onOpenMenu,
  SquareIconButton,
}) {
  return (
    <header
      className="fixed inset-x-0 z-50"
      style={{ paddingTop: "env(safe-area-inset-top,0px)" }}
    >
      <div className="mt-2 h-[56px] flex items-center px-2 gap-2">
        {/* 1: メニュー（ハンバーガー） */}
        <Slot no={1}>
          <SquareIconButton icon="☰" label="メニュー" onClick={onOpenMenu} />
        </Slot>

        {/* 2: ロゴ（背景なし・角丸・64px） */}
        <Slot no={2}>
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
        </Slot>

        <div className="ml-auto flex items-center gap-2">
          {/* 3: ジェム */}
          <Slot no={3}>
            <div className="w-16 h-[30px] flex items-center justify-center rounded-full bg-[#285e8c]/80 border border-white/30 text-[11px]">
              ジェム
            </div>
          </Slot>

          {/* 4: 総戦力 */}
          <Slot no={4}>
            <div className="w-16 h-[30px] flex items-center justify-center rounded-full bg-[#285e8c]/80 border border-white/30 text-[11px]">
              総戦力
            </div>
          </Slot>

          {/* 5: X共有 */}
          <Slot no={5}>
            <button
              type="button"
              className="w-16 h-16 rounded-xl bg-[#285e8c]/80 border border-white/20 flex items-center justify-center shadow-md"
              data-no="5"
            >
              <span className="text-2xl leading-none">𝕏</span>
            </button>
          </Slot>
        </div>
      </div>
    </header>
  );
}
