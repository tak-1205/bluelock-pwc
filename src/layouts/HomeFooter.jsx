// src/layouts/HomeFooter.jsx
import React from "react";

/**
 * HomeScreen用 Footer
 * - Slot + HIDDEN_NUMBERS は親(HomeScreen)から渡す（正準仕様の一元管理）
 * - タブ数が減っても均等割りにする（auto-fit）
 */
export default function HomeFooter({ Slot }) {
  return (
    <footer
      className="fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom,0px)" }}
    >
      <div className="h-[72px] flex items-center px-2">
        {/* ✅ 存在するタブ数で均等に並ぶ */}
        <div className="w-full grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(0,1fr))]">
          <Slot no={21}>
            <FooterTab icon="🏠" label="ホーム" active href="/" />
          </Slot>

          <Slot no={22}>
            <FooterTab icon="👥" label="チーム" href="/tool" />
          </Slot>

          <Slot no={23}>
            <FooterTab icon="👤" label="キャラ" href="/characters" />
          </Slot>

          <Slot no={24}>
            <FooterTab icon="⚡" label="マッチ" href="/skills" />
          </Slot>

          <Slot no={25}>
            <FooterTab icon="🛒" label="ショップ" future href="/support-amazon" />
          </Slot>
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
