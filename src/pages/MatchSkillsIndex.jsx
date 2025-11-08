import React, { useMemo, useState, useEffect, useCallback } from "react";
import SEO from "@/components/SEO.jsx";
import TwoColumnLayout from "@/layouts/TwoColumnLayout.jsx";
import SideMenu from "@/layouts/SideMenu.jsx";
import RightAds from "@/layouts/RightAds.jsx";
import PageHeader from "@/components/PageHeader.jsx";
//import { matchSkills as RAW_MATCH_SKILLS } from "@/data/matchSkills.js";
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

function highlight(text, term) {
  if (!term) return text;
  // 生テキストに対して大小区別なしの部分一致（日本語OK）
  try {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const parts = String(text).split(re);
    const matches = String(text).match(re) || [];
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      out.push(parts[i]);
      if (i < matches.length) {
        out.push(<mark key={i} className="px-0.5 rounded bg-warning/40">{matches[i]}</mark>);
      }
    }
    return out;
  } catch {
    return text;
  }
}


function toHiragana(s) {
  return String(s || "").replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}
function toKatakana(s) {
  return String(s || "").replace(/[\u3041-\u3096]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/* ---------- data normalize ---------- */
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

  // ★ 一意なID（raw.id が無ければ name+index を採用）
  const idBase = raw?.id ?? `${name}__${idx}`;
  const id = String(idBase).replace(/\s+/g, "_");
  const _key = `${id}`; // map用の安定キー

  return {
    id,          // クリック展開などに使用（今後これも一意）
    _key,        // ★ React の key に使う
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
  options = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} 人` })), // ← 追加
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
      onError={(e) => {
        e.currentTarget.style.opacity = "0.35";
      }}
    />
  );
}

/* ---------- main list ---------- */
function MatchSkillsList() {
  const skills = useNormalizedSkills();

  const [qInput, setQInput] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchScope, setSearchScope] = useState("both");

  const [activatorCount, setActivatorCount] = useState("");
  const [targetCount, setTargetCount] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  // ① 対象キャラフィルタ（IDの配列）。選んだIDすべてを含むスキルだけ表示します。
  const [targetFilterIds, setTargetFilterIds] = useState([]);
  // 対象キャラとして登場する全ID（一覧表示用）
  const allTargetIds = useMemo(
    () =>
      Array.from(
        new Set(
          (skills || []).flatMap((s) =>
            Array.isArray(s.targets) ? s.targets : []
          )
        )
      ).sort(),
    [skills]
  );
  const toggleTargetId = useCallback((id) => {
    setTargetFilterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);
  const clearTargetFilter = useCallback(() => setTargetFilterIds([]), []);

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    setQApplied(qInput.trim());
  }, [qInput]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSearch();
    },
    [handleSearch]
  );

  const handleClear = useCallback(() => {
    setQInput("");
    setQApplied("");
    setHasSearched(false);
    setExpanded(new Set());
  }, []);

  // === フィルタ ===
  const filtered = useMemo(() => {
    if (!hasSearched) return [];
    const qRaw = qApplied.trim();
    const qNorm = normalizeText(qRaw);
    const wantsCount = Number(targetCount) || null;
    const wantsACount = Number(activatorCount) || null;

    return skills.filter((s) => {
      if (wantsCount && s.targets.length !== wantsCount) return false;
      if (wantsACount && s.activators.length !== wantsACount) return false;
      // ② 選択された target ID を全て含むか（部分集合判定）
      if (targetFilterIds.length > 0) {
        for (const tid of targetFilterIds) {
          if (!s.targets.includes(tid)) return false;
        }
      }
      if (!qRaw) return true;

      // ✅ 正規化済みハヤスタックで厳密に判定（生テキストの includes は使わない）
      const hitDetail = s.__hayDetail.includes(qNorm);
      const hitName   = s.__hayName.includes(qNorm);

      if (searchScope === "detail") return hitDetail;
      if (searchScope === "name") return hitName;
      return hitDetail || hitName; // both
    });
  }, [skills, hasSearched, qApplied, searchScope, targetCount, activatorCount, targetFilterIds]);

  // === ページング & 展開 ===
  const [page, setPage] = useState(1);
  const PAGE = 40;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));

  useEffect(() => {
    setPage(1);
  }, [qApplied, targetCount, activatorCount, targetFilterIds]);

  const pageItems = useMemo(
    () => filtered.slice(0, page * PAGE),
    [filtered, page]
  );

  useEffect(() => {
    if (targetFilterIds.length > 0 && !hasSearched) {
      setHasSearched(true);
      setQApplied((prev) => (prev ?? qInput).trim());
    }
    // 何も return しない（クリーンアップ不要）
  }, [targetFilterIds, hasSearched, qInput]);

  useEffect(() => {
    if (!hasSearched) {
      return; // ここでの return は「クリーンアップ関数なし」を示すだけなのでOK
    }
    setExpanded(new Set(filtered.map((s) => s.id)));
  }, [hasSearched, filtered]);

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
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">マッチスキル検索</h2>
            <p className="text-sm opacity-70">
              検索後にスキルカードを表示します。カードは展開状態で表示されます。
            </p>
          </div>
          <div className="text-xs opacity-70">
            {hasSearched
              ? `表示 ${filtered.length} / 総数 ${skills.length}`
              : "検索で絞り込んで表示します"}
          </div>
        </div>

        {/* Controls */}
        <form
          className="mb-4 flex flex-col items-center gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          {/* 上段：検索欄＋ボタン＋スコープ */}
          <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
            <div className="flex w-full sm:max-w-[600px] items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-base-300 bg-base-100">
                <IconSearch className="h-4 w-4 opacity-70" />
              </span>
              <input
                type="text"
                autoComplete="off"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="スキル名または詳細で検索（Enterで確定）"
                className="input input-bordered h-10 w-full"
              />
              {qInput && (
                <button
                  type="button"
                  className="btn btn-ghost h-10 min-h-10"
                  onClick={handleClear}
                  aria-label="クリア"
                >
                  <IconX className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="btn btn-primary h-10 min-h-10 px-6 shrink-0"
              >
                検索
              </button>
              <select
                className="select select-sm w-auto min-w-[120px]"
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value)}
                aria-label="検索対象"
              >
                <option value="both">両方</option>
                <option value="name">スキル名のみ</option>
                <option value="detail">スキル詳細のみ</option>
              </select>
            </div>
          </div>

          {/* 下段：対象人数＋発動者人数 */}
          <div className="w-full flex flex-col items-center gap-3 sm:flex-row sm:flex-nowrap sm:justify-center sm:gap-4">
            <Select
              value={targetCount}
              onChange={setTargetCount}
              placeholder="対象人数（すべて）"
            />
            <Select
              value={activatorCount}
              onChange={setActivatorCount}
              placeholder="発動者人数（すべて）"
              options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} 人` }))}
            />
          </div>
          {/* ③ 対象キャラで絞り込み（複数選択可） */}
          <div className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold opacity-70">対象キャラで絞り込み</div>
              <div>
                {targetFilterIds.length > 0 && (
                  <button type="button" onClick={clearTargetFilter} className="btn btn-xs">
                    選択クリア ({targetFilterIds.length})
                  </button>
                )}
              </div>
            </div>
            {/* === 対象キャラフィルタ === */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {allTargetIds.map((cid) => {
                const isSelected = targetFilterIds.includes(cid);
                const isDisabled = targetFilterIds.length > 0 && !isSelected;

                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => {
                      if (isDisabled) return;        // 無効時はクリック無視
                      toggleTargetId(cid);
                    }}
                    disabled={isDisabled}            // アクセシビリティ上も無効化
                    aria-pressed={isSelected}
                    aria-disabled={isDisabled}
                    className={`p-0 rounded-xl focus:outline-none ${
                      isDisabled ? "cursor-not-allowed" : "hover:opacity-80"
                    }`}
                    title={cid}
                  >
                    <CharacterIcon id={cid} selected={isSelected} disabled={isDisabled} />
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* === リスト === */}
        {!hasSearched && targetFilterIds.length === 0 && (
          <div className="mt-10 text-center text-sm opacity-70">
            検索語を入力して「検索」するか、下の<span className="font-semibold">対象キャラのアイコン</span>を選択してください。
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
                    <article
                      key={s._key}
                      className="card border border-base-300 bg-base-100 shadow hover:shadow-md transition"
                    >
                      <button
                        className="text-left"
                        onClick={() => toggleExpand(s.id)}
                        aria-expanded={isOpen}
                      >
                        <div className="card-body p-4">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h3 className="text-base font-semibold leading-tight">
                              {s.name}
                            </h3>
                            <IconChevronUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </div>
                          <div
                            className={
                              "text-sm text-base-content/90 leading-relaxed whitespace-pre-line " +
                              (isOpen ? "" : "line-clamp-6")
                            }
                          >
                            {s.detail}
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div id={`detail-${s.id}`} className="px-4 pb-4 pt-0">
                          <div className="divider my-3"></div>
                          <div className="space-y-4">
                            <section>
                              <div className="mb-2 text-xs font-semibold opacity-70">
                                発動対象
                              </div>
                              {s.targets.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {s.targets.map((cid) => (
                                    <CharacterIcon key={cid} id={cid} />
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs opacity-60">情報なし</div>
                              )}
                            </section>

                            <section>
                              <div className="mb-2 text-xs font-semibold opacity-70">
                                発動者
                              </div>
                              {s.activators.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {s.activators.map((cid) => (
                                    <CharacterIcon key={cid} id={cid} />
                                  ))}
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
