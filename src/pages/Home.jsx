// src/pages/Home.jsx
import { Link } from "react-router-dom";
import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";

export default function Home() {
  return (
    <TwoColumnLayout  sidebar={<SideMenu />} right={<RightAds />}>

            <section className="mx-auto max-w-5xl px-4 py-10">
              <h1 className="text-2xl md:text-3xl font-bold">【開発中】PWC </h1>
              <p className="mt-2 text-neutral-700">
                5人まで選ぶと、発動するマッチスキルを一覧。人気組み合わせランキングや「1人入れ替え提案」も対応。
              </p>

              <div className="bg-base-200">
                <div className="container mx-auto px-4 py-8">
                  <div className="card card-side bg-base-100 shadow-sm">
                    {/* 画像を右側にしたいので md 以上で order を反転 */}
                    <figure className="p-6 md:order-2">
                      <img
                        src="https://img.daisyui.com/images/stock/photo-1635805737707-575885ab0820.webp"
                        alt="機能イメージ"
                        className="max-w-sm rounded-lg shadow-2xl"
                      />
                    </figure>

                    <div className="card-body md:order-1">
                      <h2 className="card-title text-3xl md:text-4xl">マッチスキル抽出ツール</h2>
                      <p className="text-neutral-700">
                        キャラを選択すると即時に発動スキルを抽出し、ランキングや入れ替え候補も提示します。
                      </p>

                      {/* 元の3カラム説明をカード内に配置 */}
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="card bg-base-100 shadow-md">
                          <div className="card-body p-4">
                            <h3 className="card-title text-sm">スキル抽出</h3>
                            <p className="text-sm text-neutral-700">
                              キャラ選択で即時に発動スキルを抽出。
                            </p>
                          </div>
                        </div>

                        <div className="card bg-base-100 shadow-md">
                          <div className="card-body p-4">
                            <h3 className="card-title text-sm">ランキング</h3>
                            <p className="text-sm text-neutral-700">
                              匿名集計で人気の組み合わせを集計。
                            </p>
                          </div>
                        </div>

                        <div className="card bg-base-100 shadow-md">
                          <div className="card-body p-4">
                            <h3 className="card-title text-sm">入れ替え提案</h3>
                            <p className="text-sm text-neutral-700">
                              4人一致 + 1人入替で発動数が増える候補を提示します。
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ボタンは DaisyUI に置換 */}
                      <div className="card-actions justify-end mt-2">
                        <Link to="/tool" className="btn btn-primary">詳細へ</Link>
                        {/*<Link to="/ranking" className="btn btn-outline">人気の組み合わせを見る</Link>*/}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-10 text-xs text-neutral-500">
                ※本サイトは非公式のファンメイドツールです。原作・各権利者とは関係ありません。
              </p>
            </section>

            <footer className="border-t border-neutral-200">
              <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-600 flex gap-4">
                <span>© {new Date().getFullYear()} pwc-egoist</span>
                <Link to="/privacy" className="hover:underline">プライバシー</Link>
              </div>
            </footer>
     </TwoColumnLayout>
  );
}
