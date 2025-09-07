// src/App.jsx
import CharacterSelector from "./components/CharacterSelector";
import { characterList as characterListRaw } from "./data/characterList";
import { matchSkills as matchSkillsRaw } from "./data/matchSkills";
import { normalizeId, canonicalId } from "./utils/ids";
import { Row, Section, Select, Toggle, Button, Badge, Chip, Pill } from "./components/UiBits";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Home from "./pages/Home";

import { logCombo } from "./lib/logCombo";
import Ranking from "./pages/Ranking";
import SuggestionsBar from "./components/SuggestionsBar";
import { suggestOneOffs } from "./utils/suggestOneOffs";
import { countActivatedSkills } from "./utils/match";
import AdSlot from "./components/AdSlot";
import AffiliateRail from "./components/AffiliateRail";
import { affiliateItems } from "./data/affiliateItems";

/** 効果テキスト：3行固定＋フェード＋スクロール手がかり */
function EffectText({ children }) {
  const ref = useRef(null);
  const [topShadow, setTopShadow] = useState(false);
  const [bottomShadow, setBottomShadow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollHeight > el.clientHeight + 1;
      setBottomShadow(overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 1);
      setTopShadow(overflow && el.scrollTop > 1);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [children]);

  return (
    <div className="mt-2">
      {/* スクロール領域（高さ固定） */}
      <div className="relative">
        <p
          ref={ref}
          className="
            mb-0 text-sm leading-5 h-[3.75rem]
            overflow-y-auto pr-2 scroll-thin
            [scrollbar-gutter:stable]
          "
        >
          <strong>効果:</strong> {children}
        </p>

        {/* フェードはテキストボックス内で重ねる（本文には被るが、下のインジケータとは別領域） */}
        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-5",
            "bg-gradient-to-b from-transparent to-white",
            bottomShadow ? "opacity-100" : "opacity-0",
            "transition-opacity duration-150",
          ].join(" ")}
        />
        <div
          className={[
            "pointer-events-none absolute inset-x-0 top-0 h-4",
            "bg-gradient-to-t from-transparent to-white",
            topShadow ? "opacity-100" : "opacity-0",
            "transition-opacity duration-150",
          ].join(" ")}
        />
      </div>

      {/* ← ここがポイント：テキストの“外側”にインジケータ用の固定枠を常に確保 */}
      <div className="h-6 flex items-center justify-center">
        <div
          className={[
            "w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center",
            "pointer-events-none transition-opacity",
            bottomShadow ? "opacity-100" : "opacity-0", // 続きがあるときだけ表示
          ].join(" ")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" className="text-neutral-600">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// 選択確定デバウンス（将来のAdSense/ランキングにも流用可）
function useStabilizedAction(delayMs = 600) {
  const [tick, setTick] = useState(0);
  const tRef = useRef(null);
  const trigger = () => {
    if (tRef.current) clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setTick((v) => v + 1), delayMs);
  };
  return { tick, trigger };
}

// localStorage ヘルパ
const persist = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

export default function App() {
  const location = useLocation();

  // ===== データ正規化 =====
  const characterList = useMemo(
    () => (characterListRaw || []).map((c) => ({ ...c, id: normalizeId(c.id) })),
    []
  );
  const matchSkills = useMemo(
    () =>
      (matchSkillsRaw || []).map((s) => ({
        ...s,
        target1: normalizeId(s.target1),
        target2: normalizeId(s.target2),
        target3: normalizeId(s.target3),
        target4: normalizeId(s.target4),
        target5: normalizeId(s.target5),
        activator1: normalizeId(s.activator1),
        activator2: normalizeId(s.activator2),
        activator3: normalizeId(s.activator3),
        activator4: normalizeId(s.activator4),
        activator5: normalizeId(s.activator5),
      })),
    []
  );

  // 参照マップ
  const charBy = useMemo(() => {
    const byId = new Map();
    const byCanon = new Map();
    for (const c of characterList) {
      const n = normalizeId(c.id);
      const k = canonicalId(c.id);
      if (!byId.has(n)) byId.set(n, c);
      if (!byCanon.has(k)) byCanon.set(k, c);
    }
    return { byId, byCanon };
  }, [characterList]);

  // ===== 選択状態 =====
  const [selectedCharacters, setSelectedCharacters] = useState([]);

  // URL 復元
  const encodeIds = (ids) => btoa(unescape(encodeURIComponent(JSON.stringify(ids))));
  const decodeIds = (encoded) => {
    try {
      return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    } catch {
      return [];
    }
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedIds = params.get("ids");
    if (encodedIds) {
      const ids = decodeIds(encodedIds).filter(Boolean).map(normalizeId);
      const restored = characterList.filter((c) => ids.includes(c.id));
      setSelectedCharacters(restored);
    }
  }, [characterList]);

  // 共有URL
  const handleShare = () => {
    const ids = selectedCharacters.map((c) => normalizeId(c.id));
    const encoded = encodeIds(ids);
    const url = `${window.location.origin}${window.location.pathname}?ids=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("共有用URLをコピーしました！");
  };

  // 選択変更（URL更新 & 確定トリガ）
  const { tick: committedTick, trigger: triggerCommitted } = useStabilizedAction(600);
  const handleSelectCharacters = (list) => {
    setSelectedCharacters(list);
    const ids = list.map((c) => normalizeId(c.id));
    const encoded = encodeIds(ids);
    const url = `${window.location.origin}${window.location.pathname}?ids=${encoded}`;
    window.history.replaceState(null, "", url);
    triggerCommitted();
    // 選び直し中は提案を一旦消しておく
    setSuggestions([]);
    setSuggestionsBase(0);
  };

  const selectedIds = useMemo(() => selectedCharacters.map((c) => normalizeId(c.id)), [selectedCharacters]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCanonicalSet = useMemo(() => new Set(selectedIds.map(canonicalId)), [selectedIds]);

  // アフィリエイト表示のON/OFF（.env で VITE_FEATURE_AFF=on/off）
　const SHOW_AFF = import.meta.env.VITE_FEATURE_AFF === "on";

  // 提案（1人入れ替え）を表示するための state（計算は適用時に1回だけ）
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsBase, setSuggestionsBase] = useState(0);

　// AdSenseの再読み込みトリガ（「適用」時だけ増やす）
　const [adKey, setAdKey] = useState(0);

  // ← ここで「適用」ハンドラを定義（selectedIds が使える位置）
  const handleApply = () => {
    if (!selectedIds.length) {
      alert("キャラを選択してください（最大5人）");
      return;
    }
    // ランキング用の匿名ログ送信（3秒クールダウンはlogCombo側で実施）
    logCombo(selectedIds);
    // 広告の再リクエスト（過剰更新を避けるため「適用」時だけ）
    setAdKey((k) => k + 1);
    // 将来：広告リフレッシュ等はここに集約

    // ★ここでだけ計算：5名揃っている時に1回だけ
    if (selectedIds.length === 5) {
      const base = countActivatedSkills(selectedIds);
      const items = suggestOneOffs(selectedIds, 5); // 4名一致・1名だけ入替
      setSuggestions(items);
      setSuggestionsBase(base);
    } else {
      setSuggestions([]);
      setSuggestionsBase(0);
    }
  };

  // ID→キャラ
  const getCharacterById = (id) => {
    const n = normalizeId(id);
    const direct = charBy.byId.get(n);
    if (direct) return direct;
    const can = canonicalId(n);
    return charBy.byCanon.get(can) || null;
  };

  // ===== 表示設定・検索 =====
  const [query, setQuery] = useState(persist.get("ui.query", ""));
  const [sortKey, setSortKey] = useState(persist.get("ui.sortKey", "name-asc")); // name-asc | targets-desc | activators-desc
  const [viewMode, setViewMode] = useState(persist.get("ui.viewMode", "grid")); // grid | list
  const [showIds, setShowIds] = useState(persist.get("ui.showIds", false));

  // クイックフィルタ（人数）
  const [filterTargets, setFilterTargets] = useState(persist.get("ui.filterTargets", 0));     // 0=すべて, 2/3/4/5
  const [filterActivators, setFilterActivators] = useState(persist.get("ui.filterActivators", 0)); // 0=すべて, 1..5

  useEffect(() => persist.set("ui.query", query), [query]);
  useEffect(() => persist.set("ui.sortKey", sortKey), [sortKey]);
  useEffect(() => persist.set("ui.viewMode", viewMode), [viewMode]);
  useEffect(() => persist.set("ui.showIds", showIds), [showIds]);
  useEffect(() => persist.set("ui.filterTargets", filterTargets), [filterTargets]);
  useEffect(() => persist.set("ui.filterActivators", filterActivators), [filterActivators]);

  // ===== スキル抽出 =====
  const matchedSkillsRaw = useMemo(() => {
    const arr = matchSkills.filter((skill) => {
      const targets = [skill.target1, skill.target2, skill.target3, skill.target4, skill.target5]
        .filter(Boolean)
        .map(normalizeId);
      const activators = [skill.activator1, skill.activator2, skill.activator3, skill.activator4, skill.activator5]
        .filter(Boolean)
        .map(normalizeId);
      const involved = [...new Set([...targets, ...activators])];

      const isSubset = involved.length > 0 && involved.every((id) => selectedSet.has(id));
      if (isSubset) return true;

      const involvedCanonical = involved.map(canonicalId);
      return involvedCanonical.length > 0 && involvedCanonical.every((id) => selectedCanonicalSet.has(id));
    });

    // 重複排除（name + detail + sorted targets）
    const seen = new Set();
    const out = [];
    for (const s of arr) {
      const targetsKey = [s.target1, s.target2, s.target3, s.target4, s.target5]
        .filter(Boolean)
        .map(normalizeId)
        .sort()
        .join("|");
      const key = `${s.name || ""}__${s.detail || s.effect || ""}__${targetsKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }, [matchSkills, selectedSet, selectedCanonicalSet]);

  // 検索
  const filteredByQuery = useMemo(() => {
    const q = query.trim();
    if (!q) return matchedSkillsRaw;
    const lower = q.toLowerCase();
    return matchedSkillsRaw.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const detail = (s.detail || s.effect || "").toLowerCase();
      return name.includes(lower) || detail.includes(lower);
    });
  }, [matchedSkillsRaw, query]);

  // クイックフィルタ
  const filteredByQuick = useMemo(() => {
    if (filterTargets === 0 && filterActivators === 0) return filteredByQuery;
    return filteredByQuery.filter((s) => {
      const t = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean).length;
      const a = [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean).length;
      const okT = filterTargets === 0 || t === filterTargets;
      const okA = filterActivators === 0 || a === filterActivators;
      return okT && okA;
    });
  }, [filteredByQuery, filterTargets, filterActivators]);

  // 並び替え
  const sortedSkills = useMemo(() => {
    const counts = (s) => ({
      t: [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean).length,
      a: [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean).length,
    });
    const arr = [...filteredByQuick];
    if (sortKey === "name-asc") {
      arr.sort((x, y) => String(x.name).localeCompare(String(y.name), "ja"));
    } else if (sortKey === "targets-desc") {
      arr.sort((x, y) => counts(y).t - counts(x).t || String(x.name).localeCompare(String(y.name), "ja"));
    } else if (sortKey === "activators-desc") {
      arr.sort((x, y) => counts(y).a - counts(x).a || String(x.name).localeCompare(String(y.name), "ja"));
    }
    return arr;
  }, [filteredByQuick, sortKey]);

  // ページング
  const [pageSize, setPageSize] = useState(persist.get("ui.pageSize", 30));
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [committedTick, sortKey, viewMode, query, filterTargets, filterActivators, pageSize]);
  useEffect(() => persist.set("ui.pageSize", pageSize), [pageSize]);
  const pagedSkills = useMemo(() => sortedSkills.slice(0, page * pageSize), [sortedSkills, page, pageSize]);

  // 画像フォールバック付きアイコン
  const renderCharacterIcons = (ids) => {
    const normed = ids.map(normalizeId);
    return (
      <div className="flex gap-1.5 flex-wrap">
        {normed.map((rawId) => {
          const char = getCharacterById(rawId);
          const alt = char?.name || rawId;
          const n = normalizeId(rawId);
          const c = canonicalId(rawId);
          const candidates = Array.from(
            new Set([`/images/${c}.png`, `/images/${n}.png`, `/images/${c.toLowerCase()}.png`, `/images/${n.toLowerCase()}.png`])
          );
          const initialSrc = candidates[0];

          const handleError = (e) => {
            const el = e.currentTarget;
            const tried = el.getAttribute("data-tried")?.split("|") ?? [];
            const next = candidates.find((p) => !tried.includes(p));
            if (next) {
              tried.push(next);
              el.setAttribute("data-tried", tried.join("|"));
              el.src = next;
            } else {
              el.style.display = "none";
            }
          };

          return (
            <div key={rawId} className="flex flex-col items-center">
              <img
                src={initialSrc}
                data-tried={initialSrc}
                alt={alt}
                title={alt}
                className="w-8 h-8 rounded-md object-cover"
                onError={handleError}
              />
              {showIds && <span className="text-[10px] opacity-70 mt-0.5">{normalizeId(rawId)}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  // スキルカード
  const Card = ({ s }) => {
    const targets = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
    const activators = [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean);
    return (
      <li className="border border-neutral-200 rounded-xl p-3 min-w-[200px] bg-white text-neutral-900 shadow-sm hover:shadow transition">
        <h3 className="m-0 text-base font-semibold">{s.name}</h3>
        <div className="flex items-center gap-1.5">
          <Badge tone="blue">対象 {targets.length}</Badge>
          <Badge tone="green">発動者 {activators.length}</Badge>
        </div>

        <EffectText>{s.detail}</EffectText>

        <div className="mt-2">
          <div className="text-xs mb-1 text-neutral-600">組み合わせ</div>
          {renderCharacterIcons(targets)}
        </div>
        <div className="mt-2">
          <div className="text-xs mb-1 text-neutral-600">発動者</div>
          {renderCharacterIcons(activators)}
        </div>
      </li>
    );
  };

  const resultCount = sortedSkills.length;
  const canShowMore = resultCount > pagedSkills.length;

  // ===== キーボードショートカット（/ で検索にフォーカス等） =====
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const el = document.getElementById("global-search");
        if (el) el.focus();
      }
      if (e.key.toLowerCase() === "g") {
        setViewMode((v) => (v === "grid" ? "list" : "grid"));
      }
      if (e.key.toLowerCase() === "s") {
        setSortKey((v) => (v === "name-asc" ? "targets-desc" : v === "targets-desc" ? "activators-desc" : "name-asc"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ★ トップページ：パスが "/" のときは Home を表示して終了
  if (location.pathname === "/") {
    return <Home />;
  }

  // ===== 2カラム レイアウト =====
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 min-h-screen text-neutral-900">
      {/* 左カラム: サイドバー（header相当） */}
      <aside className="md:col-span-3 border-b md:border-b-0 md:border-r border-neutral-200 bg-white p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto text-neutral-900">
        <h1 className="text-xl font-bold mb-4">キャラ選択ツール</h1>

        <div className="space-y-3">
          <Row className="gap-2">
            <a href="/" className="px-3 py-2 rounded-md border border-neutral-300 text-sm hover:bg-neutral-50">トップ</a>
            <Button onClick={handleApply}>適用</Button>
            <Button onClick={handleShare}>共有URL</Button>
            <Button variant="outline" onClick={() => setSelectedCharacters([])}>
              選択クリア
            </Button>
          </Row>

          {/* 並び替え/表示切替 */}
          <div className="space-y-2">
            <Select
              label="並び替え"
              value={sortKey}
              onChange={setSortKey}
              options={[
                { value: "name-asc", label: "名前 (昇順)" },
                { value: "targets-desc", label: "対象人数 (多い順)" },
                { value: "activators-desc", label: "発動者人数 (多い順)" },
              ]}
              className="w-full"
            />
            <Select
              label="表示"
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: "grid", label: "グリッド" },
                { value: "list", label: "リスト" },
              ]}
              className="w-full"
            />
            <Select
              label="1ページ件数"
              value={String(pageSize)}
              onChange={(v) => setPageSize(Number(v))}
              options={[
                { value: "12", label: "12件" },
                { value: "24", label: "24件" },
                { value: "36", label: "36件" },
                { value: "48", label: "48件" },
                { value: "96", label: "96件" },
              ]}
              className="w-full"
            />
            <Toggle checked={showIds} onChange={setShowIds} label="ID表示" />
          </div>

          {/* 検索 */}
          <input
            id="global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="スキル名・効果で検索（ / でフォーカス）"
            className="w-full px-3 py-2 rounded-md border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-800"
          />

          {/* クイックフィルタ */}
          <div className="mt-3 space-y-2">
            <div className="text-xs text-neutral-600">対象人数</div>
            <Row className="flex-wrap gap-1.5">
              {[0, 2, 3, 4, 5].map((n) => (
                <Chip key={`t-${n}`} active={filterTargets === n} onClick={() => setFilterTargets(n)}>
                  {n === 0 ? "すべて" : `${n}人`} {filterTargets === n && <Pill>✓</Pill>}
                </Chip>
              ))}
            </Row>

            <div className="text-xs text-neutral-600 mt-2">発動者人数</div>
            <Row className="flex-wrap gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <Chip key={`a-${n}`} active={filterActivators === n} onClick={() => setFilterActivators(n)}>
                  {n === 0 ? "すべて" : `${n}人`} {filterActivators === n && <Pill>✓</Pill>}
                </Chip>
              ))}
            </Row>
          </div>

          <div className="mt-4 text-xs text-neutral-500">
            ショートカット: /（検索）・g（表示切替）・s（並び替え）
          </div>
        </div>
      </aside>

      {/* 右カラム: メインコンテンツ */}
      <main className="md:col-span-9 p-4 md:p-6 overflow-y-auto text-neutral-900">
{/* 確認用：ランキング（30日） — データ0なら空でOK */}
{/*<Section title="人気の組み合わせ（30日）">
  <Ranking period="30d" />
</Section>*/}


        {/* 選択サマリー＋セレクター */}
        <Section>
          <div className="rounded-lg border border-neutral-200 p-3 bg-white">
            <Row className="justify-between">
              <div className="text-sm text-neutral-700">
                選択中: <strong>{selectedCharacters.length}</strong> 人
              </div>
              <Badge>ヒット: {sortedSkills.length}件</Badge>
            </Row>
            <div className="mt-2">
              <CharacterSelector selectedCharacters={selectedCharacters} onSelectCharacter={handleSelectCharacters} />
            </div>
          </div>
        </Section>

{/* 1キャラ違いの提案 */}
<Section title="似た組み合わせの提案（1人入れ替え）">
  <SuggestionsBar items={suggestions} baseScore={suggestionsBase} />
</Section>

{/* アフィリエイト（PR）：グリッドの外に置く */}
{SHOW_AFF && <AffiliateRail items={affiliateItems} />}

        {/* スキル一覧 */}
        <Section title={`発動するマッチスキル`}>
          {sortedSkills.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-neutral-300 rounded-xl text-sm text-neutral-600 bg-neutral-50">
              条件に一致するスキルがありません。検索語やフィルタ、選択キャラを調整してください。
            </div>
          ) : (
            <>
              <ul
                className={[
                  "p-0 m-0 list-none",
                  viewMode === "grid"
                    ? "grid [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))] gap-4"
                    : "flex flex-col gap-3",
                ].join(" ")}
              >
                {pagedSkills.map((s, i) => (
                  <React.Fragment key={`${s.name}-${i}`}>
                    <Card s={s} />
                    {import.meta.env.VITE_FEATURE_ADS === "on" && (i + 1) % 6 === 0 && (
                      <li className="list-none">
                        {/* slot は AdSense で発行された広告ユニットの data-ad-slot を入れる */}
                        <AdSlot slot="1234567890" adKey={adKey} />
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
      </main>
    </div>
  );
}
