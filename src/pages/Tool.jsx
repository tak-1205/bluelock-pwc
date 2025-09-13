// src/pages/Tool.jsx
import React, { useEffect, useRef } from "react";
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
  const selectorDialogRef = useRef(null);

  const {
    matchSkills,
    selectedCharacters,
    setSelectedCharacters,
    selectedSet,
    selectedCanonicalSet,
    handleSelectCharacters,
    handleApply,       // 中央のインライン広告は従来通り adKey で更新
    handleShare,
    suggestions,
    suggestionsBase,
    adKey,
    getCharacterById,
    SHOW_AFF,         // 中央のPRレールは今回使わないがフラグは保持
  } = useToolCore();

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

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      {/* コントロールパネル */}
      <Section>
        <div className="bg-base-100 rounded-box shadow-sm p-4 md:p-6 space-y-4">
          <Row className="justify-between items-start gap-3 flex-wrap">
            <div className="text-sm text-base-content/70">
              選択中: <strong>{selectedCharacters.length}</strong> 人  
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-info"
                onClick={() => selectorDialogRef.current?.showModal()}
              >
                選手選択
              </button>
              <Button onClick={handleShare}>共有URL</Button>
              <Button variant="outline" onClick={() => handleSelectCharacters([])}>選択クリア</Button>
            </div>
          </Row>

            {/* 選択中プレビュー（アイコン） */}
            {selectedCharacters.length > 0 && (
            <div className="mt-2">
                <Section title="選択したキャラ">
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
                </Section>
            </div>
            )}

            {/* 提案 */}
            <div className="divider"></div>
            <Section title="似た組み合わせの提案（1人入れ替え）">
                <SuggestionsBar items={suggestions} baseScore={suggestionsBase} />
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

      {/* スキル一覧 */}
      <Section title="発動するマッチスキル">
        {pagedSkills.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-base-300 rounded-xl text-sm text-base-content/70 bg-base-200/40">
            条件に一致するスキルがありません。<br />選手選択ボタンをクリックし、選択キャラを調整してください。
          </div>
        ) : (
          <>
            <div className="text-sm text-base-content/70">
                ヒット: <strong>{resultCount}</strong> 件
            </div>
            <ul
            className={[
                "p-0 m-0 list-none",
                viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2"     // 横型カードを2列で並べる
                : "flex flex-col gap-3",           // リストは縦積み
            ].join(" ")}
            >
              {pagedSkills.map((s, i) => (
                <React.Fragment key={`${s.name}-${i}`}>
                <SkillCard s={s} getCharacterById={getCharacterById} showIds={showIds} />
                    {import.meta.env.VITE_FEATURE_ADS === "on" && (i + 1) % 6 === 0 && (
                        <li className="list-none md:col-span-2">
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
      </Section>
    </TwoColumnLayout>
  );
}
