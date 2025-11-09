// src/pages/MatchSkillsIndex.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import SEO from "@/components/SEO.jsx";
import TwoColumnLayout from "@/layouts/TwoColumnLayout.jsx";
import SideMenu from "@/layouts/SideMenu.jsx";
import RightAds from "@/layouts/RightAds.jsx";
import PageHeader from "@/components/PageHeader.jsx";
// import { matchSkills as RAW_MATCH_SKILLS } from "@/data/matchSkills.js";
import { matchSkills as RAW_MATCH_SKILLS } from "@/data/matchSkills.cleaned.js";

/* ---------- icons (inline) ---------- */
const Icon = ({ children, className = "", size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const IconSearch = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></Icon>
);
const IconChevronUpDown = (p) => (
  <Icon {...p}><polyline points="7 15 12 20 17 15" /><polyline points="7 9 12 4 17 9" /></Icon>
);
const IconX = (p) => (
  <Icon {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
);

/* ---------- normalize helpers ---------- */
function normalizeText(t) {
  return String(t || "")
    .replace(/[\u200B-\u200D\uFEFF\uFE00-\uFE0F]/g, "")
    .normalize("NFKC")
    .toLowerCase();
}
function normalizeSkill(raw, idx) {
  const name = raw?.name ?? raw?.skillName ?? "(名称不明)";
  const detail = raw?.detail ?? raw?.effect ?? raw?.description ?? "";

  const targets = [];
  for (let i = 1; i <= 5; i++) {
    const v = raw?.["target" + i] ?? raw?.["発動対象" + i];
    if (v) targets.push(v);
  }
  if (Array.isArray(raw?.targets)) targets.push(...raw.targets.filter(Boolean));
  if (Array.isArray(raw?.target)) targets.push(...raw.target.filter(Boolean));

  const activators = [];
  for (let i = 1; i <= 5; i++) {
    const v = raw?.["activator" + i] ?? raw?.["発動者" + i];
    if (v) activators.push(v);
  }
  if (Array.isArray(raw?.activators)) activators.push(...raw.activators.filter(Boolean));
  if (Array.isArray(raw?.actors)) activators.push(...raw.actors.filter(Boolean));

  const idBase = raw?.id ?? `${name}__${idx}`;
  const id = String(idBase).replace(/\s+/g, "_");
  const _key = `${id}`;

  return {
    id,
    _key,
    name,
    detail,
    targets: [...new Set(targets)],
    activators: [...new Set(activators)],
    __hayDetail: normalizeText(detail),
    __hayName: normalizeText(name || ""),
    _raw: raw,
  };
}
const useNormalizedSkills = () => useMemo(() => (RAW_MATCH_SKILLS || []).map(normalizeSkill), []);

/* ---------- small UI parts ---------- */
function Toggle({ checked, onChange, label, className = "" }) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none shrink-0 whitespace-nowrap ${className}`}>
      <input type="checkbox" className="toggle" checked={checked}
        onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm opacity-80">{label}</span>
    </label>
  );
}

function Select({
  value,
  onChange,
  options = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} 人` })),
  placeholder,
  className = "",
}) {
  return (
    <select
      className={`select select-sm w-auto min-w-[180px] ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function CharacterIcon({ id, size = 44, selected = false, disabled = false }) {
  return (
    <img
      src={`/images/${id}.png`}
      alt={id}
      title={id}
      loading="lazy"
      width={size}
      height={size}
      className={`h-11 w-11 rounded-xl border object-cover transition duration-200 ${
        selected
          ? "border-primary ring-2 ring-primary/40"
          : disabled
          ? "border-base-300 opacity-40 grayscale"
          : "border-base-300"
      } bg-base-200`}
      onError={(e) => { e.currentTarget.style.opacity = "0.35"; }}
    />
  );
}

/* ---------- main list ---------- */
function MatchSkillsList() {
  const skills = useNormalizedSkills();

  // 検索テキスト
  const [qInput, setQInput] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchScope, setSearchScope] = useState("both"); // "detail" | "name" | "both"

  // 既存フィルタ
  const [targetCount, setTargetCount] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());

  // 対象キャラフィルタ
  const [targetFilterIds, setTargetFilterIds] = useState([]); // string[]
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  // 対象キャラ候補（targets からユニーク抽出）
  const allTargetIds = useMemo(() => {
    const set = new Set();
    for (const s of skills) for (const t of s.targets || []) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
  }, [skills]);

  // アイコンのトグル（1人固定）
  const toggleTargetId = useCallback((cid) => {
    setTargetFilterIds((prev) => {
      if (prev.includes(cid)) return prev.filter((x) => x !== cid);
      if (prev.length > 0) return [cid];
      return [...prev, cid];
    });
  }, []);

  // 検索確定
  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setQApplied(qInput.trim());
  }, [qInput]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSearch();
  }, [handleSearch]);

  const handleClear = useCallback(() => {
    setQInput("");
    setQApplied("");
    setHasSearched(false);
    setExpanded(new Set());
  }, []);

  // === 絞り込み ===
  const filtered = useMemo(() => {
    if (!hasSearched && targetFilterIds.length === 0) return [];

    const qRaw = qApplied.trim();
    const qNorm = normalizeText(qRaw);
    const wantsCount = Number(targetCount) || null;

    return skills.filter((s) => {
      if (wantsCount && s.targets.length !== wantsCount) return false;

      if (targetFilterIds.length > 0) {
        const set = new Set(s.targets);
        for (const id of targetFilterIds) if (!set.has(id)) return false;
      }

      if (!qRaw) return true;

      const hitDetail =
        s.__hayDetail.includes(qNorm) || normalizeText(s.detail).includes(qNorm);
      const hitName =
        s.__hayName.includes(qNorm) || normalizeText(s.name).includes(qNorm);

      if (searchScope === "detail") return hitDetail;
      if (searchScope === "name") return hitName;
      return hitDetail || hitName; // both
    });
  }, [skills, hasSearched, qApplied, searchScope, targetFilterIds, targetCount]);

  // ページング
  const [page, setPage] = useState(1);
  const PAGE = 40;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  useEffect(() => { setPage(1); }, [qApplied, targetCount, targetFilterIds, searchScope]);
  const pageItems = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page]);

  // 検索後（または対象キャラ選択時）は全カード展開
  useEffect(() => {
    if (!hasSearched && targetFilterIds.length === 0) return; // ← 何も返さない
    setExpanded(new Set(filtered.map((s) => s.id)));
  }, [hasSearched, targetFilterIds, filtered]);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body">

        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold leading-tight sm:text-2xl">マッチスキル検索</h2>
            <p className="mt-1 text-xs text-base-content/70 sm:text-sm">
              検索後にスキルカードを表示します。カードは展開状態で表示されます。
            </p>
          </div>
          <div className="text-[11px] text-base-content/60 sm:text-xs">
            {hasSearched ? `表示 ${filtered.length} / 総数 ${skills.length}` : "検索で絞り込んで表示します"}
          </div>
        </div>

        {/* Controls */}
        <form className="mb-4 space-y-3"
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          {/* 上段：検索欄＋ボタン */}
          <div className="grid w-full max-w-[680px] grid-cols-[1fr_auto] gap-2 mx-auto">
            <label className="input input-sm h-10 flex items-center gap-2">
              <IconSearch className="h-4 w-4 opacity-70" />
              <input
                type="text"
                autoComplete="off"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="スキル名または詳細で検索（Enterで確定）"
                className="grow bg-transparent outline-none"
              />
              {!!qInput && (
                <button type="button" className="btn btn-ghost btn-xs" onClick={handleClear} aria-label="クリア">
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </label>
            <button type="submit" className="btn btn-primary h-10 min-h-10 px-5">検索</button>
          </div>

          {/* 下段：プルダウン2つ */}
          <div className="grid w-full max-w-[680px] grid-cols-2 gap-2 mx-auto">
            <Select
              value={targetCount}
              onChange={setTargetCount}
              placeholder="対象人数（すべて）"
              options={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n} 人` }))}
              className="w-full"
            />
            <select
              className="select select-sm w-full"
              value={searchScope}
              onChange={(e) => setSearchScope(e.target.value)}
              aria-label="検索対象"
            >
              <option value="both">名前＋詳細</option>
              <option value="name">名前のみ</option>
              <option value="detail">詳細のみ</option>
            </select>
          </div>

          {/* 対象キャラモーダル起動＆選択済み表示 */}
          <div className="w-full max-w-[680px] mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowTargetPicker(true)}
              className="btn btn-sm btn-outline rounded-xl"
            >
              対象キャラを選ぶ {targetFilterIds.length > 0 ? `（${targetFilterIds.length}）` : ""}
            </button>
            {targetFilterIds.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto">
                {targetFilterIds.slice(0, 6).map((cid) => (
                  <CharacterIcon key={`chip-${cid}`} id={cid} size={28} selected />
                ))}
                {targetFilterIds.length > 6 && (
                  <span className="badge badge-ghost text-[10px]">+{targetFilterIds.length - 6}</span>
                )}
              </div>
            )}
          </div>
        </form>

        {/* === モーダル === */}
        {showTargetPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowTargetPicker(false)} />
            <div className="relative z-10 w-full max-w-[900px] rounded-2xl bg-base-100 shadow-xl border border-base-300">
              <div className="p-4 border-b border-base-300 flex items-center justify-between">
                <h3 className="text-base font-semibold">対象キャラで絞り込み</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowTargetPicker(false)}>
                  閉じる
                </button>
              </div>

              <div className="p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="text-xs opacity-70">
                    クリックで選択／再クリックで解除。1キャラ選択中は他をグレー表示します。
                  </div>
                  {targetFilterIds.length > 0 && (
                    <button type="button" className="btn btn-xs" onClick={() => setTargetFilterIds([])}>
                      全解除
                    </button>
                  )}
                </div>

                <div className="max-h-[60vh] overflow-auto">
                  <div
                    className="grid grid-cols-[repeat(auto-fill,44px)] justify-center gap-[5px] sm:gap-[5px] md:gap-[5px] p-1"
                    style={{ gridAutoRows: "44px" }}
                  >

                    {allTargetIds.map((cid) => {
                      const isSelected = targetFilterIds.includes(cid);
                      const isDisabled = targetFilterIds.length > 0 && !isSelected;
                      return (
                        <button
                          key={`picker-${cid}`}
                          type="button"
                          onClick={() => { if (!isDisabled) toggleTargetId(cid); }}
                          disabled={isDisabled}
                          aria-pressed={isSelected}
                          className={`p-0 rounded-xl ${isDisabled ? "cursor-not-allowed" : "hover:opacity-80"}`}
                          title={cid}
                        >
                          <CharacterIcon id={cid} selected={isSelected} disabled={isDisabled} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-base-300 flex items-center justify-end gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setShowTargetPicker(false)}>
                  キャンセル
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (targetFilterIds.length > 0 && !hasSearched) {
                      setHasSearched(true);
                      setQApplied((prev) => (prev ?? qInput).trim());
                    }
                    setShowTargetPicker(false);
                  }}
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === リスト === */}
        {!hasSearched && targetFilterIds.length === 0 && (
          <div className="mt-10 text-center text-sm opacity-70">
            検索語を入力して「検索」するか、<span className="font-semibold">対象キャラを選ぶ</span>から選択してください。
          </div>
        )}

        {hasSearched && (
          <>
            {pageItems.length === 0 ? (
              <div className="mt-10 text-center text-sm opacity-70">
                {targetFilterIds.length > 0
                  ? "選択した対象キャラをすべて含むスキルは見つかりませんでした。"
                  : "条件に合致するスキルが見つかりませんでした。"}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((s) => {
                  const isOpen = expanded.has(s.id);
                  return (
                    <article key={s._key} className="card border border-base-300 bg-base-100 shadow hover:shadow-md transition">
                      <button className="text-left" onClick={() => toggleExpand(s.id)} aria-expanded={isOpen}>
                        <div className="card-body p-4">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold leading-tight">{s.name}</h3>
                            <IconChevronUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </div>
                          <div className={"text-sm text-base-content/90 leading-relaxed whitespace-pre-line " + (isOpen ? "" : "line-clamp-6")}>
                            {s.detail}
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div id={`detail-${s.id}`} className="px-4 pb-4 pt-0">
                          <div className="divider my-3"></div>
                          <div className="space-y-4">
                            <section>
                              <div className="mb-2 text-xs font-semibold opacity-70">発動対象</div>
                              {s.targets.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {s.targets.map((cid) => <CharacterIcon key={cid} id={cid} />)}
                                </div>
                              ) : (
                                <div className="text-xs opacity-60">情報なし</div>
                              )}
                            </section>

                            <section>
                              <div className="mb-2 text-xs font-semibold opacity-70">発動者</div>
                              {s.activators.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {s.activators.map((cid) => <CharacterIcon key={cid} id={cid} />)}
                                </div>
                              ) : (
                                <div className="text-xs opacity-60">情報なし</div>
                              )}
                            </section>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* Load more */}
            {page < pageCount && (
              <div className="mt-6 flex justify-center">
                <button className="btn btn-sm" onClick={() => setPage((p) => Math.min(p + 1, pageCount))}>
                  さらに表示 ({page * PAGE} / {filtered.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- page wrapper ---------- */
export default function MatchSkillsIndexPage() {
  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <SEO title="マッチスキル検索" canonical="/skills" />
      <PageHeader title="マッチスキル検索" />
      <MatchSkillsList />
    </TwoColumnLayout>
  );
}
