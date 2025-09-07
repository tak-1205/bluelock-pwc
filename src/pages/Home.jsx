// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="font-bold">pwc-egoist</div>
          <nav className="flex gap-4 text-sm">
            <Link to="/tool" className="hover:underline">ツール</Link>
            <Link to="/ranking" className="hover:underline">ランキング</Link>
            <Link to="/privacy" className="hover:underline">プライバシー</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold">PWC スキル組み合わせ検索</h1>
        <p className="mt-2 text-neutral-700">
          5人まで選ぶと、発動するマッチスキルを一覧。人気組み合わせランキングや「1人入れ替え提案」も対応。
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/tool" className="px-4 py-2 rounded-md bg-black text-white text-sm">今すぐ使う</Link>
          <Link to="/ranking" className="px-4 py-2 rounded-md border text-sm">人気の組み合わせを見る</Link>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">高速検索</h3>
            <p className="text-sm text-neutral-700">キャラ選択で即時に発動スキルを抽出。ID揺れは正規化済み。</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">ランキング</h3>
            <p className="text-sm text-neutral-700">匿名集計で人気の組み合わせを集計（集計対象: 最近 / 全期間）。</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold">入れ替え提案</h3>
            <p className="text-sm text-neutral-700">4人一致 + 1人入替で発動数が増える候補を提示します。</p>
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
    </main>
  );
}
