// src/components/UiBits.jsx
import React from "react";

/* =========================
   見出し（daisyUIトーン）
   ========================= */
export const H1 = ({ children, className = "" }) => (
  <h1 className={`text-2xl md:text-3xl font-bold text-base-content ${className}`}>{children}</h1>
);

export const H2 = ({ children, className = "" }) => (
  <h2 className={`text-xl md:text-2xl font-semibold text-base-content/90 ${className}`}>{children}</h2>
);

export const H3 = ({ children, className = "" }) => (
  <h3 className={`text-lg md:text-xl font-semibold text-base-content/80 ${className}`}>{children}</h3>
);

/** ページ先頭のヒーロー風ヘッダ */
export const PageHeader = ({ title, subtitle, rightSlot = null, className = "" }) => (
  <header className={`hero bg-base-200 rounded-2xl p-4 md:p-6 ${className}`}>
    <div className="hero-content w-full flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-1">
        <H1 className="mb-1">{title}</H1>
        {subtitle ? <p className="text-base-content/70">{subtitle}</p> : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  </header>
);

/* =========================
   レイアウト外枠（左右余白 + 最大幅）
   ========================= */
export const Shell = ({ children, className = "" }) => (
  <div className={`max-w-screen-xl mx-auto px-4 md:px-6 ${className}`}>{children}</div>
);

/* =========================
   カード（daisyUI）
   ========================= */
export const Card = ({ title, children, footer = null, className = "" }) => (
  <div className={`card bg-base-100 shadow-lg rounded-2xl ${className}`}>
    <div className="card-body">
      {title ? <h3 className="card-title">{title}</h3> : null}
      {children}
    </div>
    {footer ? <div className="card-actions justify-end p-4 pt-0">{footer}</div> : null}
  </div>
);

/** 横並び */
export const Row = ({ children, className = "" }) => (
  <div className={`flex items-center gap-3 ${className}`}>{children}</div>
);

/** セクション
 *  - 後方互換：既存の {title, children, className} だけでも従来どおり動作
 *  - 追加: desc（説明文）, rightSlot（右上エリア）, asCard（中身をcardで囲む）
 */
export const Section = ({ title, desc, rightSlot = null, asCard = false, children, className = "" }) => (
  <section className={`mt-4 ${className}`}>
    {(title || desc || rightSlot) && (
      <div className="mb-3 md:mb-4 flex items-start justify-between gap-3">
        <div>
          {title ? <h2 className="text-lg md:text-xl font-semibold">{title}</h2> : null}
          {desc ? <p className="text-sm md:text-base text-base-content/70">{desc}</p> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    )}
    {asCard ? (
      <div className="card bg-base-100 shadow-lg rounded-2xl">
        <div className="card-body p-4 md:p-6">{children}</div>
      </div>
    ) : (
      children
    )}
  </section>
);

/** ボタン */
export const Button = ({ children, onClick, variant = "solid", className = "", type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    className={[
      "px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap",
      "appearance-none select-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-800",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      variant === "outline"
        ? "border border-neutral-300 bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
        : "bg-neutral-900 text-white hover:bg-neutral-800",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

/** セレクト */
export const Select = ({ value, onChange, options, label, className = "", size = "sm" }) => (
  <label className={`inline-flex items-center gap-2 ${className}`}>
    {label && <span className="text-xs text-neutral-700">{label}</span>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "rounded border border-neutral-300 bg-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800",
        size === "sm" ? "px-2 py-1.5" : "px-3 py-2",
      ].join(" ")}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </label>
);

/** トグル */
export const Toggle = ({ checked, onChange, label, className = "" }) => (
  <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="size-4 accent-neutral-800"
    />
    <span className="text-xs text-neutral-900">{label}</span>
  </label>
);

/** バッジ（hoverしない前提で可読色固定） */
export const Badge = ({ children, tone = "neutral", className = "" }) => {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-900",
    blue: "bg-blue-100 text-blue-900",
    green: "bg-green-100 text-green-900",
    orange: "bg-orange-100 text-orange-900",
    red: "bg-rose-100 text-rose-900",
  };
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${tones[tone] || tones.neutral} ${className}`}>
      {children}
    </span>
  );
};

/** 入力 */
export const Input = React.forwardRef(({ value, onChange, placeholder = "", className = "", autoFocus = false }, ref) => (
  <input
    ref={ref}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    autoFocus={autoFocus}
    className={`w-full px-3 py-2 rounded-md border border-neutral-300 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 ${className}`}
  />
));

/** チップ（クイックフィルタ） */
export const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={[
      "px-2.5 py-1 rounded-full text-xs border transition font-medium",
      active
        ? "bg-neutral-900 text-white border-neutral-900"
        // ▼ 非アクティブ時の hover を neutral-100 に、文字は常に黒で明示
        : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900",
    ].join(" ")}
  >
    {children}
  </button>
);

/** 小さな数値ピル */
export const Pill = ({ children }) => (
  <span className="inline-flex items-center justify-center min-w-5 px-1.5 py-0.5 rounded-full bg-neutral-200 text-[11px] text-neutral-900 font-medium">
    {children}
  </span>
);
