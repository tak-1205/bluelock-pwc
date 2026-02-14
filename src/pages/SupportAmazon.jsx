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

  // 任意：運営の「判断期限」を環境変数で制御（無ければ表示しない）
  const DEADLINE = useMemo(
    () => import.meta.env.VITE_SUPPORT_DEADLINE || "",
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

  // 1クリックで「コピー→Amazonを開く」まで進めたい人向け（任意）
  const handleQuickStart = useCallback(async () => {
    await handleCopy();
    handleOpen();
  }, [handleCopy, handleOpen]);

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <SEO title="Amazonで支援する" canonical="/support-amazon" />
      <PageHeader title="運営継続についてのご相談" />

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          {/* ====== ここが勝負：短く、強く ====== */}
          <div className="rounded-2xl border border-base-300 bg-base-200/60 p-5 md:p-6">
            <h1 className="text-xl md:text-2xl font-bold mb-2">
              PWC EGOIST を続けるために、300円の応援をお願いできますか？
            </h1>

            <p className="text-sm md:text-base text-base-content/80 leading-relaxed">
              PWC EGOIST は個人で開発・運営しています。
              現在、サーバー代の負担が厳しく、今後の運営継続を検討しています。
              もしこのツールが役に立った方がいれば、
              <span className="font-semibold">一度だけでも</span>応援してもらえると助かります。
            </p>

            {/* 期限がある場合のみ表示（嘘にならない範囲で運用） */}
            {DEADLINE ? (
              <div className="alert alert-warning mt-4">
                <span className="text-sm">
                  ⚠️ {DEADLINE} までに反応がなければ、更新停止・運営縮小を予定しています。
                </span>
              </div>
            ) : (
              <div className="alert alert-info mt-4">
                <span className="text-sm">
                  ※ 応援が増えれば、サーバー代を確保でき、継続して改善できます。
                </span>
              </div>
            )}

            {/* ====== 最短導線：ここだけで完結 ====== */}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={handleQuickStart}
                className="btn btn-primary rounded-2xl"
              >
                ①メールをコピーして ②Amazonを開く
              </button>

              <div className="flex items-center gap-2">
                <code className="px-3 py-2 rounded-xl bg-base-100 text-sm break-all w-full border border-base-300">
                  {RECIPIENT}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-sm rounded-xl"
                >
                  {copied ? "Copied!" : "コピー"}
                </button>
              </div>
            </div>

            <p className="text-xs text-base-content/60 mt-3 leading-relaxed">
              Amazonギフト券（Eメールタイプ）で送れます。金額は「その他」で <b>300円</b> を入れるだけでOKです。
              新しいタブで開きます（Amazonログインが必要）。
            </p>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleOpen}
                className="link link-primary text-sm"
              >
                Amazonギフト券ページだけ開く
              </button>
            </div>
          </div>

          {/* ====== 詳細は折りたたみ：読む人だけ読む ====== */}
          <div className="mt-8">
            <details className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-2xl">
              <summary className="collapse-title text-base font-semibold">
                支援の手順（詳細を見る）
              </summary>
              <div className="collapse-content">
                <div className="divider my-6">手順</div>

                {/* ✅ ステップUI（既存をそのまま活かす） */}
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
                        金額は「その他」で 300円 を入力
                      </h3>
                      <p className="text-sm text-base-content/70 mb-3">
                        ギフト券のデザインを選び、「金額を入力」欄で「その他」を選んで <b>300円</b> を入力します。
                        （他の金額でもOKです）
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
                            配送先住所は不要です。AmazonアカウントにログインしてEメールタイプを送信するだけで完結します。
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
            </details>
          </div>

          {/* ====== 追いCTA：下にも1つだけ ====== */}
          <div className="mt-8 flex flex-col md:flex-row gap-3">
            <button
              type="button"
              onClick={handleQuickStart}
              className="btn btn-primary rounded-2xl"
            >
              今すぐ応援する（コピー→Amazon）
            </button>
            <button
              type="button"
              onClick={handleOpen}
              className="btn rounded-2xl"
            >
              Amazonだけ開く
            </button>
          </div>

          <p className="text-xs text-base-content/60 mt-3">
            ※ いただいた支援は、サーバー代・ドメイン代など運営費に充てます。
          </p>
        </div>
      </div>
    </TwoColumnLayout>
  );
}
