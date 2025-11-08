import React, { useState, useCallback, useMemo } from "react";
import SEO from "@/components/SEO.jsx";
import TwoColumnLayout from "@/layouts/TwoColumnLayout.jsx";
import SideMenu from "@/layouts/SideMenu.jsx";
import RightAds from "@/layouts/RightAds.jsx";
import PageHeader from "@/components/PageHeader.jsx";

export default function SupportAmazon() {
  const [copied, setCopied] = useState(false);

  const RECIPIENT = useMemo(
    () => import.meta.env.VITE_SUPPORT_RECIPIENT || "support@example.com",
    []
  );
  const AMAZON_EGIFT_URL = useMemo(
    () =>
      import.meta.env.VITE_SUPPORT_AMAZON_URL ||
      "https://www.amazon.co.jp/dp/B004N3APGO",
    []
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(RECIPIENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
      alert("コピーに失敗しました。手動で選択→コピーしてください。");
    }
  }, [RECIPIENT]);

  const handleOpen = useCallback(() => {
    try {
      const url = AMAZON_EGIFT_URL;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("window.open failed", e);
    }
  }, [AMAZON_EGIFT_URL]);

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <SEO title="Amazonで支援する" canonical="/support-amazon" />
      <PageHeader title="『PWC EGOIST』ご支援のお願い" />

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h1 className="card-title text-2xl md:text-3xl mb-2">「『PWC EGOIST』の運営継続にご協力ください」</h1>

          <p className="text-base text-base-content/80 leading-relaxed mb-4">
            当サイト「PWC EGOIST」は、個人による制作・運営で成り立っています。
            今後も継続的に更新・改善を行っていくために、
            ごくわずかでも結構ですので、投げ銭（寄付）によるご協力をお願いいたします。
          </p>

          <p className="text-sm text-base-content/70 mb-6">
            Amazon.co.jp の「ギフト券（Eメールタイプ）」を利用して、150円から簡単にご支援いただけます。
            下記の手順に沿って操作してください。
          </p>

          <div className="divider my-6">手順</div>

          {/* ✅ ステップUI */}
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6 relative">
            {/* timeline line */}
            <div className="hidden md:block absolute left-6 top-8 bottom-0 border-l-2 border-base-300" />
            <ol className="space-y-10 w-full">
              {/* Step 1 */}
              <li className="relative pl-10 md:pl-12">
                <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shadow-sm">
                  1
                </div>
                <h3 className="font-semibold text-lg mb-2">受取メールをコピー</h3>
                <p className="text-sm text-base-content/70 mb-3">
                  下記のボタンを押すと、支援用のメールアドレスがコピーされます。
                </p>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] items-center max-w-md">
                  <code className="px-3 py-2 rounded-xl bg-base-200 text-sm break-all w-full">
                    {RECIPIENT}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn btn-sm rounded-xl btn-primary"
                  >
                    {copied ? "Copied!" : "コピー"}
                  </button>
                </div>
              </li>

              {/* Step 2 */}
              <li className="relative pl-10 md:pl-12">
                <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shadow-sm">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-2">Amazonギフト券ページを開く</h3>
                <p className="text-sm text-base-content/70 mb-3">
                  以下のボタンからAmazonの「Eメールタイプ」ギフト券ページを開きます。
                </p>
                <button
                  type="button"
                  onClick={handleOpen}
                  className="btn btn-primary rounded-2xl"
                >
                  Amazonギフト券（Eメールタイプ）を開く
                </button>
                <p className="text-xs text-base-content/60 mt-2">
                  新しいタブで開きます。Amazonアカウントへのログインが必要です。
                </p>
              </li>

              {/* Step 3 */}
              <li className="relative pl-10 md:pl-12">
                <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shadow-sm">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  Amazonギフト券ページでデザインと金額を選択
                </h3>
                <p className="text-sm text-base-content/70 mb-3">
                  ギフト券のデザインを選び、「金額を入力」欄に任意の金額を入力します。
                  「その他」を選ぶと自由に設定できます（例：300円など）。
                </p>
                <img
                  src="/images/support/step3.png"
                  alt="Amazonギフト券のデザイン・金額選択画面"
                  className="rounded-lg border border-base-300 w-full max-w-md mx-auto shadow-sm"
                  loading="lazy"
                />
              </li>

              {/* Step 4 */}
              <li className="relative pl-10 md:pl-12">
                <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold shadow-sm">
                  4
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  受取人にメールを貼り付けて送信
                </h3>
                <p className="text-sm text-base-content/70 mb-3">
                  「受取人」の欄に Step 1 でコピーしたメールアドレスを貼り付けてください。
                  メッセージは空欄でも構いません。その後、「今すぐ購入」で送信完了です。
                </p>
                <img
                  src="/images/support/step4.png"
                  alt="受取人にメールを貼り付ける操作画面"
                  className="rounded-lg border border-base-300 w-full max-w-md mx-auto shadow-sm"
                  loading="lazy"
                />
              </li>
            </ol>
          </div>

            {/* よくある質問 */}
            <div className="divider my-8">よくある質問</div>

            <div className="space-y-4">
            {/* Q1 */}
            <div className="bg-base-200 rounded-xl p-4 shadow-sm border border-base-300">
                <div className="flex items-start gap-3">
                <span className="badge badge-primary text-white font-bold mt-1">Q</span>
                <div>
                    <h4 className="font-semibold text-base-content">
                    配送先住所やクレジットカード登録は必要ですか？
                    </h4>
                    <div className="flex items-start gap-3 mt-2">
                    <span className="badge badge-neutral text-white font-bold mt-1">A</span>
                    <p className="text-sm text-base-content/80 leading-relaxed">
                        このページは支援専用です。配送先住所やクレジットカード登録は不要で、
                        Amazonアカウントにログインするだけで送信可能です。
                    </p>
                    </div>
                </div>
                </div>
            </div>

            {/* Q2 */}
            <div className="bg-base-200 rounded-xl p-4 shadow-sm border border-base-300">
                <div className="flex items-start gap-3">
                <span className="badge badge-primary text-white font-bold mt-1">Q</span>
                <div>
                    <h4 className="font-semibold text-base-content">
                    ギフト券のメールが届かない場合はどうすればいいですか？
                    </h4>
                    <div className="flex items-start gap-3 mt-2">
                    <span className="badge badge-neutral text-white font-bold mt-1">A</span>
                    <p className="text-sm text-base-content/80 leading-relaxed">
                        Amazonの注文履歴ページで送信状況を確認できます。<br />
                        「未送信」や「送信エラー」となっている場合は、Amazonカスタマーサービスへお問い合わせください。
                    </p>
                    </div>
                </div>
                </div>
            </div>

            {/* Q3 */}
            <div className="bg-base-200 rounded-xl p-4 shadow-sm border border-base-300">
                <div className="flex items-start gap-3">
                <span className="badge badge-primary text-white font-bold mt-1">Q</span>
                <div>
                    <h4 className="font-semibold text-base-content">
                    領収書や支援の証明書は発行されますか？
                    </h4>
                    <div className="flex items-start gap-3 mt-2">
                    <span className="badge badge-neutral text-white font-bold mt-1">A</span>
                    <p className="text-sm text-base-content/80 leading-relaxed">
                        領収書はAmazonの注文履歴から発行できます。<br />
                        サイト運営者からの個別の領収証明書の発行は行っておりません。
                    </p>
                    </div>
                </div>
                </div>
            </div>
            </div>

        </div>
      </div>
    </TwoColumnLayout>
  );
}
