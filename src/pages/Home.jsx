// src/pages/Home.jsx
import { Link } from "react-router-dom";
import SEO from "../components/SEO.jsx";
import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";

export default function Home() {
  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <SEO
        title="ホーム"
        description="ブルーロックPWCのデータ・ツールを扱うPWC EGOIST。マッチスキル抽出などを提供。"
        image="/images/kv2.png"
        canonical="/"
      />

      {/* Hero（画像はPCで右、SPで上） */}
      <section className="mx-auto max-w-5x">

      {/* ビジュアルバナー（横長）：CLS回避のためアスペクトを予約 + 多フォーマット */}
      <div className="container mx-auto mt-2">
        <div className="rounded-2xl overflow-hidden bg-base-200">
          <div className="w-full rounded-2xl aspect-[16/9]">
           <div className="w-full rounded-2xl aspect-[16/9]">
             <img
               src="/images/mv.jpg"  
               alt="キービジュアル"
               className="w-full h-full object-cover"
               width="1920"
               height="1080"
               fetchPriority="high"
               decoding="async"
               loading="eager"
             />
           </div>
          </div>
        </div>
      </div>

        {/* 追加：サイトの説明（幅を既存の container に合わせる） */}
        <section className="mt-6">
          <div className="container mx-auto">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body">
                <h2 className="card-title text-xl">PWC EGOISTについて</h2>
                <p className="text-sm text-base-content/70">
                  2025年9月にオープンしたブルーロックPWCのデータベースサイトです。
                </p>
                <p className="text-sm text-base-content/70">
                  これからコンテンツを順次追加予定です。
                </p>
                <p className="text-sm text-base-content/70">
                  追加してほしい機能についてや、機能に不具合や間違いなどを見つけましたら、<a href="https://x.com/pwc_egoist" target="_brank" className="font-bold text-primary">Xアカウント</a>や<a href="/contact/" target="_brank" className="font-bold text-primary">お問い合わせフォーム</a>からご連絡ください。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 追加：機能・コンテンツの説明（同じく container 揃え） */}
        <section className="mt-6 mb-8">
          <div className="container mx-auto">
            <h2 className="text-xl font-bold mb-3">機能・コンテンツ</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* 稼働中 */}
              <div className="card bg-base-100 shadow-sm">
                <figure className="h-64 w-full bg-base-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/matchskill_img.png"
                    alt="チーム編成作成ツール"
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                  />
                </figure>
                <div className="card-body">
                  <h3 className="card-title">チーム編成作成ツール</h3>
                  <p className="text-sm text-base-content/70">
                    キャラを選択すると即時に発動スキルと発動スキル数を抽出。
                  </p>
                  <div className="card-actions justify-end">
                    <Link to="/tool" className="btn btn-sm btn-primary">使ってみる</Link>
                  </div>
                </div>
              </div>

              {/* 準備中その1 */}
              <div className="card bg-base-100 shadow-sm">
                <figure className="h-64 w-full bg-base-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/feature-ranking.png"
                    alt="人気チーム編成"
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                  />
                </figure>
                <div className="card-body">
                  <h3 className="card-title">
                    人気チーム編成 <span className="badge badge-ghost badge-sm">準備</span>
                  </h3>
                  <p className="text-sm text-base-content/70">
                    よく使われる組み合わせを集計し可視化。
                  </p>
                  <div className="card-actions justify-end">
                    <button className="btn btn-sm btn-disabled">準備</button>
                  </div>
                </div>
              </div>

              {/* 準備中その2 */}
              <div className="card bg-base-100 shadow-sm">
                <figure className="h-64 w-full bg-base-200 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/feature-character.png"
                    alt="キャラ別一覧"
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.src = "/images/placeholder.png")}
                  />
                </figure>
                <div className="card-body">
                  <h3 className="card-title">
                    キャラ別一覧 <span className="badge badge-ghost badge-sm">準備中</span>
                  </h3>
                  <p className="text-sm text-base-content/70">
                    キャラごとの発動スキルを一覧表示。キャラの相性をまとめて確認。（準備中）
                  </p>
                  <div className="card-actions justify-end">
                    <button className="btn btn-sm btn-disabled">準備中</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

      </section>
      
    </TwoColumnLayout>
  );
}
