// src/components/SupportAmazonBanner.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const RECIPIENT = import.meta.env.VITE_SUPPORT_RECIPIENT || "support@example.com";
const AMAZON_EGIFT_URL =
  import.meta.env.VITE_SUPPORT_AMAZON_URL || "https://www.amazon.co.jp/dp/B004N3APGO";

export default function SupportAmazonBanner() {
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RECIPIENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      alert("コピーに失敗しました。手動で選択→コピーしてください。");
    }
  };

  return (
    <div className="mt-6 md:mt-8">
      {/* 淡いブルー基調 */}
      <div className="rounded-2xl p-5 md:p-6 bg-blue-100 text-blue-900 shadow-sm">
        {/* 見出し：お願いトーン */}
        <h2 className="text-xl md:text-2xl font-extrabold text-center">
          『PWC EGOIST』の運営継続にご協力ください
        </h2>

        {/* 短文メッセージ：控えめで誠実に */}
        <p className="text-center text-sm md:text-base mt-1 mb-3 text-blue-900/90">
          サイト運営の継続に向けて、ごくわずかでもご支援をいただけますと幸いです。
        </p>

        {/* 補足行：方法と最小額 */}
        <p className="text-center text-xs md:text-sm opacity-80 mb-4 -mt-1">
          Amazonでご支援いただけます
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1) 受取メールのコピー（カード全体クリック） */}
          <div
            onClick={handleCopy}
            className="card bg-base-100 rounded-2xl shadow hover:shadow-md transition cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label="受取メールアドレスをコピー"
          >
            <div className="card-body items-center text-center">
              <p className="font-semibold">①受取メールアドレスをコピー</p>

              {/* Gmailロゴ（枠フィット） */}
              <div className="w-28 h-20 md:w-32 md:h-24 my-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"/>
                  <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"/>
                  <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
                  <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"/>
                  <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"/>
                </svg>
              </div>

              <code className="px-3 py-2 rounded-xl bg-base-200 text-sm break-all">
                {RECIPIENT}
              </code>

              <p className="btn btn-link text-pink-600 mt-1">
                ▼ クリック / タップでコピー
                {copied && <span className="text-green-600 ml-1">✓</span>}
              </p>
            </div>
          </div>

          {/* 2) Amazonページを開く（カード全体リンク） */}
          <a
            href={AMAZON_EGIFT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="card bg-base-100 rounded-2xl shadow hover:shadow-md transition cursor-pointer block"
            aria-label="Amazonギフト券の支援ページを開く"
          >
            <div className="card-body items-center text-center">
              <p className="font-semibold">②Amazonの支援ページを開く</p>

              {/* Amazonロゴ（枠フィット） */}
              <div className="w-24 h-24 my-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-full h-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path fill="#FFB300" d="M39.6,39c-4.2,3.1-10.5,5-15.6,5c-7.3,0-13.8-2.9-18.8-7.4c-0.4-0.4,0-0.8,0.4-0.6
                    c5.4,3.1,11.5,4.9,18.3,4.9c4.6,0,10.4-1,15.1-3C39.7,37.7,40.3,38.5,39.6,39z M41.1,36.9c-0.5-0.7-3.5-0.3-4.8-0.2
                    c-0.4,0-0.5-0.3-0.1-0.6c2.3-1.7,6.2-1.2,6.6-0.6c0.4,0.6-0.1,4.5-2.3,6.3c-0.3,0.3-0.7,0.1-0.5-0.2
                    C40.5,40.4,41.6,37.6,41.1,36.9z"/>
                  <path fill="#37474F" d="M36.9,29.8c-1-1.3-2-2.4-2-4.9v-8.3c0-3.5,0-6.6-2.5-9c-2-1.9-5.3-2.6-7.9-2.6
                    C19,5,14.2,7.2,13,13.4c-0.1,0.7,0.4,1,0.8,1.1l5.1,0.6c0.5,0,0.8-0.5,0.9-1c0.4-2.1,2.1-3.1,4.1-3.1c1.1,0,3.2,0.6,3.2,3v3
                    c-3.2,0-6.6,0-9.4,1.2c-3.3,1.4-5.6,4.3-5.6,8.6c0,5.5,3.4,8.2,7.8,8.2c3.7,0,5.9-0.9,8.8-3.8c0.9,1.4,1.3,2.2,3,3.7
                    c0.4,0.2,0.9,0.2,1.2-0.1l0,0c1-0.9,2.9-2.6,4-3.5C37.4,30.9,37.3,30.3,36.9,29.8z M27,22.1L27,22.1c0,2-0.1,6.9-5,6.9
                    c-3,0-3-3-3-3c0-4.5,4.2-5,8-5V22.1z"/>
                </svg>
              </div>

              <p className="btn btn-link text-pink-600">▼ Amazonギフト券ページを開く</p>
            </div>
          </a>
        </div>

        {/* /support-amazon では下部ボタンを表示しない */}
        {location.pathname !== "/support-amazon" && (
          <div className="text-center mt-5">
            <Link to="/support-amazon" className="btn btn-lg rounded-full px-8">
              ご支援の詳細を見る
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
