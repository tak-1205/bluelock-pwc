// src/components/PageHeader.jsx
import React from "react";

/**
 * ページ上部の共通見出し
 * - title: 必須。ページの大見出し（中央カラムのタイトル）
 * - eyebrow: 任意。小さな前置きテキスト
 * - subtitle: 任意。説明文（1～2行想定）
 * - right: 任意。右側のアクション（ボタン等）を差し込めます
 * - className: 任意。余白など微調整用
 */
export default function PageHeader({
  title,
  eyebrow,
  subtitle,
  right = null,
  className = "",
}) {
  return (
    <header className={["mb-4 md:mb-6", className].join(" ")}>
      <div className="bg-base-100/80 backdrop-blur rounded-box border border-base-300 shadow-sm p-4 md:p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <div className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
                {eyebrow}
              </div>
            )}
            <h1 className="text-xl md:text-2xl font-bold leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-base-content/70">{subtitle}</p>
            )}
          </div>
          {right}
        </div>
      </div>
    </header>
  );
}
