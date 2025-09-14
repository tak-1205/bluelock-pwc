// src/layouts/SiteFooter.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="footer footer-horizontal footer-center bg-base-200 text-base-content w-full mt-10">
      <div className="w-full">
        {/* 全幅表示。必要なら container を入れて横幅を絞る */}
        <div className="px-4 py-10">
          {/* 注意書き */}
          <p className="text-xs text-base-content/60">
            ※本サイトは個人運営のサイトです。原作・各権利者とは関係ありません。
          </p>

          {/* リンク */}
          <nav className="grid grid-flow-col gap-4 my-4">
            <Link to="/privacy" className="link link-hover">プライバシー</Link>
            <Link to="/contact" className="link link-hover">お問い合わせ</Link>
          </nav>

          {/* SNSアイコン（ダミー） */}
          <nav>
            <div className="flex justify-center">
               <a
                href="https://x.com/pwc_egoist"
                target="_blank"
                rel="noopener"
                aria-label="X"
                >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="fill-current"
                    aria-label="X"
                    >
                    <path d="M18.244 2H21l-6.75 7.743L22.5 22h-6.75l-5.293-6.597L4.5 22H2l7.5-8.607L1.5 2h6.75l4.963 6.195L18.244 2zm-2.25 18h1.74L8.757 4h-1.74L16 20z" />
                </svg>
              </a>
            </div>
          </nav>

          <aside className="mt-4">
            <p>{new Date().getFullYear()} - pwc-egoist</p>
          </aside>
        </div>
      </div>
    </footer>
  );
}
