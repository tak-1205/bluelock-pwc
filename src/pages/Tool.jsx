// src/pages/Tool.jsx
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import SEO from "../components/SEO.jsx";
import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";

import useToolCore from "../hooks/useToolCore.js";
import useSkillsPipeline from "../hooks/useSkillsPipeline.js";

import CharacterSelector from "../components/CharacterSelector.jsx";
import SuggestionsBar from "../components/SuggestionsBar.jsx";
import AdSlot from "../components/AdSlot.jsx";
import SkillCard from "../components/tool/SkillCard.jsx";
import { Row, Section, Select, Toggle, Button, Badge, Chip, Pill } from "../components/UiBits.jsx";
import { triggerAdsRefresh } from "../lib/adBus.js"; // ★ 右カラム更新イベント
import { buildImageCandidates, makeImageFallbackHandler } from "../lib/imagePath";

export default function Tool() {
  // ★ まず最初に宣言（これより前で参照しない）
  const selectorDialogRef = useRef(null);
  const location = useLocation();
  const lastAppliedIdsRef = useRef("");     // 直近に処理した署名
  const pendingApplySigRef = useRef("");    // state反映後に apply するための署名

  const {
    matchSkills,
    selectedCharacters,
    setSelectedCharacters,
    selectedSet,
    selectedCanonicalSet,
    selectedIds,
    handleSelectCharacters,
    handleApply,       // 中央のインライン広告は従来通り adKey で更新
    handleShare,
    handleShareX,
    suggestions,
    suggestionsBase,
    adKey,
    getCharacterById,
    SHOW_AFF,         // 中央のPRレールは今回使わないがフラグは保持
  } = useToolCore();
  // ↑ 既存の分割に含まれていない場合は、下記のように selectedIds も受け取ってください
  // const { ..., selectedIds, ... } = useToolCore();

  const pipeline = useSkillsPipeline({ matchSkills, selectedSet, selectedCanonicalSet });
  const {
    query, setQuery,
    sortKey, setSortKey,
    viewMode, setViewMode,
    showIds, setShowIds,
    filterTargets, setFilterTargets,
    filterActivators, setFilterActivators,
    pageSize, setPageSize,
    page, setPage,
    pagedSkills, resultCount, canShowMore,
  } = pipeline;

  // ショートカット
  useEffect(() => {
    const onKey = (e) => {
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const el = document.getElementById("global-search");
        if (el) el.focus();
    };
    if (selectedCharacters.length < 5) {
        setSuggestions([]);
        setSuggestionsBase(0);
    };
    if (e.key.toLowerCase() === "g") setViewMode((v) => (v === "grid" ? "list" : "grid"));
    if (e.key.toLowerCase() === "s")
        setSortKey((v) => (v === "name-asc" ? "targets-desc" : v === "targets-desc" ? "activators-desc" : "name-asc"));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setViewMode, setSortKey, selectedCharacters]);

  // /tool?ids=... を「ペイント前」に適用（ID→オブジェクト配列に変換して選択のみ反映）
  useLayoutEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const b64 = params.get("ids");
    if (!b64) return;

    // useToolCore と同じデコード（URL-safe Base64 も許容）
    const decodeB64Json = (b) => {
      const norm = b.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b.length / 4) * 4, "=");
      // JSONは encodeURIComponent でエンコードされている前提
      return JSON.parse(decodeURIComponent(escape(atob(norm))));
    };

    try {
      const arr = decodeB64Json(b64);
      if (!Array.isArray(arr)) return;

      // 文字列化＋空要素除去＋重複排除
      const uniqIds = Array.from(new Set(arr.map((x) => String(x)).filter(Boolean)));
      if (!uniqIds.length) return;

      // ★ ID配列 → キャラ“オブジェクト配列”へ（ここが重要！）
      const next = uniqIds.map((id) => getCharacterById?.(id)).filter(Boolean);
      if (!next.length) return;

      const signature = next.map((c) => c.id).join(",");
      if (signature === lastAppliedIdsRef.current) return; // 同一ならスキップ
      lastAppliedIdsRef.current = signature;

      // 先に選択だけ反映。apply は state 反映後に別エフェクトで実行
      pendingApplySigRef.current = signature;
      handleSelectCharacters(next);
    } catch {
      /* 破損クエリは無視 */
    }
  }, [location.search, getCharacterById, handleSelectCharacters]);

  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) return;
    const sig = selectedIds.join(",");
    if (pendingApplySigRef.current && pendingApplySigRef.current === sig) {
      pendingApplySigRef.current = "";
      handleApply();
    }
  }, [selectedIds, handleApply]);

  return (
    
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <SEO
        title="チーム編成作成ツール"
        description="キャラ選択から発動スキルを即時抽出。並び替え・検索・入れ替え提案に対応。"
        canonical="/tool"
      />
      <PageHeader
        title="チーム編成作成ツール"
        subtitle="キャラを選ぶだけで、発動するマッチスキルが分かります。入れ替え提案や共有にも対応。"
      />
     {/* 使い方（ガイド） */}
     <Section title="使い方">
       <div className="bg-base-100 rounded-box border border-base-300 shadow-sm">
         <details className="collapse collapse-arrow">
           <summary className="collapse-title text-base font-semibold">
             チーム編成作成ツールの使い方（かんたんガイド）
           </summary>
           <div className="collapse-content text-sm text-base-content/80 leading-relaxed">
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                <span className="font-medium">「選手選択」</span>を押し、モーダルでキャラを最大5人選んで
                <span className="font-medium">「検索」</span>。
              </li>
              <li>
                中央の「<span className="font-medium">発動するマッチスキル</span>」に結果が表示されます。
                バッジの<span className="font-medium">対象</span>/<span className="font-medium">発動者</span>は一致数です。
              </li>
              <li>
                下の「<span className="font-medium">似た組み合わせの提案</span>」をタップすると、
                その組み合わせでこのページ（<code>/tool</code>）に切り替わります（<span className="font-medium">＋/−</span>は発動数の増減）。
              </li>
              <li>
                共有は「<span className="font-medium">共有URL</span>」でURLコピー、
                <span className="font-medium">Xで共有</span>は5人選択時に有効です。
              </li>
            </ol>
            <div className="mt-3">
              <div className="text-xs text-base-content/60">
                キーボードで下記を押すと表示切り替えや並べ替え可能です。
              </div>
              <div className="text-xs text-base-content/60 mb-2">
                小技：
                <kbd className="kbd kbd-xs">/</kbd> 検索フォーカス、
                <kbd className="kbd kbd-xs">G</kbd> 表示切替（グリッド/リスト）、
                <kbd className="kbd kbd-xs">S</kbd> 並び替え切替。
              </div>
              <div className="text-xs text-base-content/60 mt-1">
                データの誤りや改善提案は
                <a href="https://x.com/pwc_egoist" target="_blank" className="link link-primary mx-1">Xアカウント</a>
                または
                <a href="/contact/" className="link link-primary mx-1">お問い合わせ</a>
                からお知らせください。
              </div>
            </div>
          </div>
        </details>
       </div>
      </Section>

     {/* 操作（コントロールパネル） */}
     <Section title="ツール">
        <div className="bg-base-100 rounded-box shadow-sm p-2 md:p-6 space-y-4">
          <Row className="gap-3 md:gap-4 flex-col md:flex-row md:items-start md:justify-between">
            <div className="text-sm text-base-content/70">
              選択中: <strong>{selectedCharacters.length}</strong> 人
            </div>
          
            {/* スマホ：2列グリッドで各ボタンをw-full / md以上：横並び */}
            <div className="w-full md:w-auto grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2">
              <button
                type="button"
                className="btn btn-info btn-sm md:btn-md w-full md:w-auto"
                onClick={() => selectorDialogRef.current?.showModal()}
                aria-label="選手選択"
              >
                選手選択
              </button>

              <Button
                variant="outline"
                onClick={() => handleSelectCharacters([])}
                className="btn btn-sm md:btn-md w-full md:w-auto"
                title="選択をクリア"
              >
                選択クリア
              </Button>
          
              <Button
                onClick={handleShare}
                className="btn btn-sm md:btn-md w-full md:w-auto"
                title="共有用URLをコピー"
              >
                共有URL
              </Button>
          
              <Button
                className="btn btn-sm md:btn-md w-full md:w-auto gap-2"
                onClick={handleShareX}
                disabled={selectedCharacters.length !== 5}
                title="選択5人・発動件数・共有URLをXに投稿"
              >
                Xで共有
              </Button>
          
            </div>
          </Row>

          {/* 検索ボックス（/ でフォーカス） */}
          <Row className="items-center gap-3 flex-wrap">
            <div className="w-full md:w-auto">
              <div className="join w-full md:w-96">
                <input
                  id="global-search"
                  type="search"
                  className="input input-bordered input-sm md:input-md join-item w-full"
                  placeholder="スキル名・効果を検索"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm md:btn-md join-item"
                    onClick={() => setQuery("")}
                    aria-label="検索条件をクリア"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>
          </Row>

         {/* 選択中（プレビュー） */}
         {selectedCharacters.length > 0 && (
           <Section title="選択したキャラ">
             <div className="bg-base-100 rounded-box shadow-sm p-4 md:p-6">
               <div className="flex flex-wrap gap-2">
                    {selectedCharacters.map((c) => {
                        const candidates = buildImageCandidates(c.id);
                        const initialSrc = candidates[0];
                        const name = c.name || c.id;

                        return (
                        <div key={c.id} className="avatar" title={name}>
                            <div className="w-20 h-20 rounded-lg ring ring-base-300">
                            <img
                                src={initialSrc}
                                data-idx="0"
                                alt={name}
                                onError={makeImageFallbackHandler(candidates)}
                                loading="lazy"
                            />
                            </div>
                        </div>
                        );
                    })}
                    </div>
                </div>
            </Section>
            )}

       {/* 提案 */}
       <Section title="似た組み合わせのチーム編成提案">
         <div className="bg-base-100 rounded-box shadow-sm p-4 md:p-6 space-y-3">
           <p className="text-sm text-base-content/70">
             提案をクリックすると、その組み合わせで結果に切り替わります（＋/− は発動数の増減）。
           </p>
           <SuggestionsBar items={suggestions} baseScore={suggestionsBase} />
         </div>
       </Section>

          {/* モーダル：選手選択 */}
          <dialog ref={selectorDialogRef} className="modal">
            <div className="modal-box max-w-5xl">
              <h3 className="font-bold text-lg">選手を選ぶ</h3>
              <div className="mt-4 max-h-[70vh] overflow-y-auto">
                <CharacterSelector
                  selectedCharacters={selectedCharacters}
                  onSelectCharacter={handleSelectCharacters}
                />
              </div>
              <div className="modal-action">
                <form method="dialog">
                  <button className="btn">閉じる</button>
                </form>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleApply();          // 中央の処理（ログ/提案/インライン広告 adKey）
                    triggerAdsRefresh();    // ★ 右カラムにも「更新して」と合図
                    selectorDialogRef.current?.close();
                  }}
                >
                  検索
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </div>
      </Section>

       {/* 結果（スキル一覧） */}
       <Section title="発動するマッチスキル">
         <div className="bg-base-100 rounded-box shadow-sm p-2 md:p-6 space-y-4">
          <p className="text-sm text-base-content/70 mb-5">
            ※表示されるマッチスキルが間違っている場合があります。その場合は<a href="https://x.com/pwc_egoist" target="_brank" className="font-bold text-primary">Xアカウント</a>や<a href="/contact/" target="_brank" className="font-bold text-primary">お問い合わせフォーム</a>からご連絡頂けると幸いです。
          </p>
          {pagedSkills.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-base-300 rounded-xl text-sm text-base-content/70 bg-base-200/40">
              条件に一致するスキルがありません。<br />選手選択ボタンをクリックし、選択キャラを調整してください。
            </div>
          ) : (
            <>
              <div className="text-m text-base-content/70 mb-2">
                  マッチスキル数: <strong>{resultCount}</strong> 件
              </div>
                <ul
                  className={[
                    "p-0 m-0 list-none",
                    viewMode === "grid"
                      ? [
                          // ★ PCは常に2カラムに固定（md/ lg/ xl すべて2）
                          "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 items-stretch",
                          // 子 <li> の等高・はみ出し防止
                          "[&>li]:min-w-0 [&>li]:h-full",
                          "[&>li_.card]:h-full",
                          // ★ モバイルだけコンパクト（md以上は“元の見た目”寄りに戻す）
                          "[&>li]:text-[13px] md:[&>li]:text-base",
                          "[&>li_.card-body]:p-2 md:[&>li_.card-body]:p-6",
                          "[&>li_.card-title]:text-sm md:[&>li_.card-title]:text-base",
                          "[&>li_.badge]:scale-90 md:[&>li_.badge]:scale-100",
                          // サムネ（SkillCardの .avatar 構造想定）
                          "[&>li_.avatar>div]:w-8 [&>li_.avatar>div]:h-8 md:[&>li_.avatar>div]:w-16 md:[&>li_.avatar>div]:h-16",
                          "[&>li_img]:max-w-full [&>li_img]:h-auto [&>li_img]:object-contain",
                        ].join(" ")
                      : "flex flex-col gap-3",
                  ].join(" ")}
                >
                {pagedSkills.map((s, i) => (
                  <React.Fragment key={`${s.name}-${i}`}>
                    {/* SkillCard 側が <li class="card ..."> を返す想定なので、外側で <li> を作らない */}
                    <SkillCard s={s} getCharacterById={getCharacterById} showIds={showIds} />
                    {import.meta.env.VITE_FEATURE_ADS === "on" && (i + 1) % 6 === 0 && (
                      // ★ グリッドが常に2列なので、広告は常に2列ぶち抜き
                      <li className="list-none col-span-2">
                        <AdSlot slot={import.meta.env.VITE_AD_SLOT_INLINE || ""} adKey={adKey} />
                      </li>
                    )}
                  </React.Fragment>
                ))}
              </ul>

              {canShowMore && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                    さらに表示
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Section>
    </TwoColumnLayout>
  );
}
