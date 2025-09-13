import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";

const FORM_SRC = "https://docs.google.com/forms/d/e/1FAIpQLSfy0dihmyOx-p9XdEQytMlEUw1hSxW2-2ZfosKKadX4GA0HKQ/viewform?embedded=true";

export default function Contact() {
  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={null}>
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl md:text-3xl">お問い合わせ</h1>
          <p className="text-sm text-base-content/70">
            ご質問・ご意見は以下のフォームからお送りください。個人情報の取扱いは
            <a href="/privacy" className="link link-hover">プライバシーポリシー</a>をご確認ください。
          </p>

          <div className="mt-4 rounded-box overflow-hidden border border-base-300">
            <iframe
              src={FORM_SRC}
              className="w-full"
              style={{ minHeight: 720, border: 0 }}
              loading="lazy"
              title="お問い合わせフォーム"
            />
          </div>

          <div className="mt-3 text-xs text-base-content/60">
            フォームが表示されない場合は
            <a href={FORM_SRC.replace("?embedded=true", "")} target="_blank" rel="noopener" className="link link-hover">
              こちら
            </a>
            から直接開いてください。
          </div>
        </div>
      </div>
    </TwoColumnLayout>
  );
}
