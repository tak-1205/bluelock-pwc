// src/pages/Privacy.jsx
import React from "react";
import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";

export default function Privacy() {
  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl md:text-3xl">プライバシーポリシー</h1>

          {/* Cookie/広告に関する案内 */}
          <div className="text-sm text-base-content/70 mt-2">
            <span>
              当サイトでは利便性向上のため Cookie 等を使用します。第三者配信の広告サービス（Google など）を
              利用する場合があり、ユーザの興味に応じた広告を表示するための情報が使用されることがあります。
            </span>
          </div>

          <p className="text-sm text-base-content/70">
            詳細およびオプトアウトについては各事業者のポリシーをご確認ください。お問い合わせは X/Twitter 等の
            DM までお願いします。
          </p>

          <div className="divider my-6">アフィリエイトについて</div>

          <p className="text-sm text-base-content/70">
            当サイトは、アフィリエイトプログラム（Amazon アソシエイト、楽天アフィリエイト等）を利用しています。
            当サイトのリンクから商品・サービスが購入された場合、運営者が報酬を受け取ることがあります。
            表示内容や在庫・価格等は掲載先のサイトをご確認ください。
          </p>

          <p className="text-xs text-base-content/60">
            ※当サイトの一部リンクはアフィリエイトリンク（
            <span className="badge badge-ghost badge-sm align-middle">PR</span>
            ）です。
          </p>
        </div>
      </div>
    </TwoColumnLayout>
  );
}
