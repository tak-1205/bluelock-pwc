// src/pages/TrainingTool.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useTrainingSkillsPipeline } from "@/hooks/useTrainingSkillsPipeline.js";
import characterListData from "@/data/characterList.js";
import { supportCards } from "@/data/supportCards.js";
import { trainingSkills as sourceTrainingSkills } from "@/data/trainingSkills.js";

import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";
import CharacterSelector from "@/components/CharacterSelector.jsx";

/* ================= 共通ヘルパ ================= */
const norm = (s) => String(s || "").trim().toUpperCase();
const allChars = Array.isArray(characterListData) ? characterListData : [];

// ID判定
const isSupportId = (s) => /^SP-(?:UR|SSR|EX)\d{3}$/i.test(String(s || ""));
const isCharId = (s) => /^[A-Z]\d{3}(?:-\d{2})?$/i.test(String(s || ""));

// 参照マップ（名前→ID）
const supportByName = new Map(supportCards.map((c) => [String(c.name || "").trim(), c.id]));
const charByName = new Map(
  allChars.flatMap((c) => {
    const arr = [];
    if (c.name) arr.push([String(c.name).trim(), c.id]);
    if (c.title) arr.push([String(c.title).trim(), c.id]);
    return arr;
  })
);

// ID/名前 なんでも受け取って ID に解決
function resolveId(any) {
  const raw = String(any || "").trim();
  if (!raw) return "";
  if (isSupportId(raw) || isCharId(raw)) return raw; // 既にID
  if (supportByName.has(raw)) return supportByName.get(raw) || "";
  if (charByName.has(raw)) return charByName.get(raw) || "";
  return "";
}

/** "400%" や "４００％" → 400 に正規化（数値以外は 0） */
function parsePercentToNumber(valueStr) {
  const s = String(valueStr ?? "")
    .replace(/[％%]/g, "")
    .replace(/[^\d.\-]/g, "")
    .trim();
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** trainingSkills を“ゆるく”正規化する（__raw/全角列名に対応） */
function normalizeTrainingSkillRow(row, idx) {
  const preTargets = Array.isArray(row?.targets) ? row.targets.filter(Boolean) : [];
  const preEffects = Array.isArray(row?.effects) ? row.effects : [];
  if (preTargets.length > 0 && preEffects.length > 0) {
    const normTargets = preTargets.map((t) => String(t || "").trim().toUpperCase());
    const key =
      row.key ||
      row.id ||
      `${normTargets.join("+")}#${preEffects.map((e) => `${e.effect}/${e.detail}/${e.value}`).join("|") || idx}`;
    return { ...row, key: String(key), targets: normTargets };
  }

  const raw = row && row.__raw ? row.__raw : row || {};
  const FW = "０１２３４５６７８９";
  const toFW = (n) => String(n).split("").map((d) => FW[d] ?? d).join("");
  const pick = (obj, keys) => {
    for (const k of keys) {
      if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
    }
    return "";
  };

  const targets = [];
  for (let i = 1; i <= 10; i++) {
    const iFW = toFW(i);
    const idLike = pick(raw, [`発動対象${i}_ID`, `発動対象${iFW}_ID`, `target${i}_id`, `target${i}`]);
    let resolved = resolveId(idLike);
    if (!resolved) {
      const nameLike = pick(raw, [`発動対象${i}_名前`, `発動対象${iFW}_名前`, `name${i}`]);
      resolved = resolveId(nameLike);
    }
    if (resolved) targets.push(String(resolved).trim().toUpperCase());
  }

  let effects = [];
  if (Array.isArray(raw.effects) && raw.effects.length) {
    effects = raw.effects.map((e) => ({
      effect: String(e.effect ?? e.name ?? "").trim(),
      detail: String(e.detail ?? e.desc ?? "").trim(),
      value: String(e.value ?? e.amount ?? "").trim(),
    }));
  } else {
    for (let i = 1; i <= 30; i++) {
      const eff = pick(raw, [`効果${i}`, `effect${i}`]);
      const det = pick(raw, [`効果内容${i}`, `detail${i}`]);
      const val = pick(raw, [`効果量${i}`, `value${i}`]);
      const e = String(eff || "").trim();
      const d = String(det || "").trim();
      const v = String(val || "").trim();
      if (e || d || v) effects.push({ effect: e, detail: d, value: v });
    }
  }

  const key =
    row.key ||
    raw.key ||
    raw.id ||
    `${targets.join("+")}#${effects.map((e) => `${e.effect}/${e.detail}/${e.value}`).join("|") || idx}`;

  return { ...row, key: String(key), targets, effects, __raw: raw };
}

/* ================= 画像・小物 ================= */
const getCharById = (id) => allChars.find((c) => norm(c.id) === norm(id)) || null;
const getCharNameById = (id) => getCharById(id)?.name || getCharById(id)?.title || "";
const getSupportById = (id) => supportCards.find((x) => norm(x.id) === norm(id)) || null;
const getSupportName = (id) => getSupportById(id)?.name || "";

/* 画像 */
function CharImg({ id, alt, size = 64, className = "" }) {
  const [err, setErr] = useState(false);
  const src = err ? "/images/placeholder.png" : `/images/${id}.png`;
  return (
    <img
      src={src}
      alt={alt || ""}
      width={size}
      height={size}
      className={`object-cover rounded-xl ${className}`}
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
    />
  );
}

function SupportImg({ id, alt = "", className = "" }) {
  const [err, setErr] = React.useState(false);
  const src = err ? "/images/placeholder.png" : `/images/supportcard/${id}.png`;
  return (
    <div
      style={{ width: "100%", aspectRatio: "499 / 640", position: "relative", overflow: "hidden", borderRadius: 4 }}
      className={className}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setErr(true)}
        loading="lazy"
        decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}

function CloseDot({ onClick, title = "外す" }) {
  return (
    <button type="button" className="btn btn-xs btn-circle btn-error text-white" onClick={onClick} title={title} aria-label={title}>
      ×
    </button>
  );
}
function RarityBadgeMini({ rarity }) {
  const color = rarity === "UR" ? "bg-orange-400" : rarity === "SSR" ? "bg-purple-500" : "bg-emerald-500";
  return <div className={`absolute top-0.5 left-0.5 ${color} text-white text-[9px] font-black px-1 rounded`}>{rarity}</div>;
}
function TypeBadgeMini({ type }) {
  return <div className="absolute bottom-0.5 left-0.5 text-[9px] px-1 py-[1px] rounded bg-base-100/80 border border-base-200">{type}</div>;
}

/* ====== 定数（サイズ統一） ====== */
const CARD_TILE_W = 94;         // ダイアログ/編成欄のカード外枠の幅
const CARD_TILE_PAD = 2;        // 外枠のpadding
const SLOT_TILE_W = 94;         // 編成欄のカード外枠の幅（=94で据え置き）
const SLOT_TILE_PAD = 2;

/* === 小型サムネ（カード/選手） ===================================== */
// 内側は枠線なし。fillで親幅にフィットさせ、外枠のpadding分だけ均等余白にする
function SupportCardThumb({ card, showName = false, width, fill = false }) {
  const { id, name, rarity, type } = card;
  const WRAP_W = fill ? "100%" : (width ?? 70);
  const NAME_FONT_SIZE = 10;
  const NAME_LINES = 2;
  const NAME_LINE_HEIGHT = 1.2;
  const NAME_BOX_PX = Math.round(NAME_FONT_SIZE * NAME_LINE_HEIGHT * NAME_LINES);

  return (
    <div style={{ width: WRAP_W, textAlign: "center" }} title={name}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "499 / 640",
          overflow: "hidden",
          borderRadius: 8,
          background: "#fff",
        }}
      >
        <SupportImg id={id} alt={name} />
        <div style={{ position: "absolute", top: 2, left: 2 }}>
          <RarityBadgeMini rarity={rarity} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 2,
            right: 2,
            fontSize: 9,
            lineHeight: 1,
            padding: "2px 4px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.1)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {type}
        </div>
      </div>
      {showName && (
        <div
          style={{
            fontSize: NAME_FONT_SIZE,
            marginTop: 4,
            lineHeight: NAME_LINE_HEIGHT,
            height: NAME_BOX_PX,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: NAME_LINES,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
            whiteSpace: "normal",
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
}

// 選手の小型タイル（画像 + 名前）
function CharacterThumb({ id, muted = false, width = 70 }) {
  const c = getCharById(id);
  const name = (c?.name || c?.title || "") || "";
  const IMG_SIZE = width;
  const NAME_FONT_SIZE = 10;
  const NAME_LINES = 2;
  const NAME_LINE_HEIGHT = 1.2;
  const NAME_BOX_PX = Math.round(NAME_FONT_SIZE * NAME_LINE_HEIGHT * NAME_LINES);

  return (
    <div className={muted ? "opacity-60" : ""} style={{ width: IMG_SIZE, textAlign: "center" }} title={name}>
      <div
        style={{
          width: IMG_SIZE,
          height: IMG_SIZE,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#fff",
        }}
      >
        <CharImg id={id} alt={name} size={IMG_SIZE} className="rounded-none" />
      </div>
      <div
        style={{
          fontSize: NAME_FONT_SIZE,
          marginTop: 4,
          lineHeight: NAME_LINE_HEIGHT,
          height: NAME_BOX_PX,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: NAME_LINES,
          WebkitBoxOrient: "vertical",
          wordBreak: "break-word",
          whiteSpace: "normal",
        }}
      >
        {name}
      </div>
    </div>
  );
}
/* =================================================================== */

/* ====== ここから：CharacterSlot ====== */
function CharacterSlot({ id, onClick, onRemove }) {
  const name = id ? getCharNameById(id) : "";
  return (
    <div className="relative w-[76px] h-[76px] rounded-xl border shadow-sm bg-base-100 border-base-300">
      <button
        type="button"
        className="w-full h-full flex items-center justify-center rounded-xl"
        onClick={onClick}
        title={id ? name : "選手を追加"}
        aria-label={id ? name : "選手を追加"}
      >
        {id ? (
          <CharImg id={id} alt={name} size={76} className="rounded-xl" />
        ) : (
          <div className="flex flex-col items-center justify-center text-base-content/60">
            <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center text-lg">＋</div>
            <div className="text-[10px] mt-1">support</div>
          </div>
        )}
      </button>
      {id && (
        <div className="absolute -top-2 -right-2">
          <CloseDot onClick={onRemove} />
        </div>
      )}
    </div>
  );
}
/* =================================================================== */

/* ====== 入れ替え候補の算出（未発動用） ====== */
function buildSwapSuggestions({ ts, missingIds, selectedSupports, selectedExSupport }) {
  const targetsSet = new Set((ts.targets || []).map(norm));
  const selectedCards = [...selectedSupports, selectedExSupport].filter(Boolean).map(norm);
  const removable = selectedCards.filter((id) => !targetsSet.has(id)); // 不要カード
  const suggestions = [];
  let rIdx = 0;
  for (const miss of missingIds) {
    if (!isSupportId(miss)) continue; // カード不足のみ
    if (rIdx >= removable.length) break;
    suggestions.push({ outId: removable[rIdx++], inId: miss });
  }
  return suggestions;
}

function TrainingSkillCard({ ts, missing, selectedSupports, selectedExSupport }) {
  const swapList = useMemo(
    () => buildSwapSuggestions({ ts, missingIds: missing || [], selectedSupports, selectedExSupport }),
    [ts, missing, selectedSupports, selectedExSupport]
  );

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 rounded-2xl">
      <div className="card-body p-4 space-y-4">
        {/* 組み合わせ */}
        <div>
          <div className="text-sm opacity-70">組み合わせ</div>
          <div className="mt-2 flex flex-wrap gap-3 items-start">
            {(ts.targets || []).map((id) => <TargetTile key={id} id={id} />)}
          </div>
        </div>

        {/* 効果 */}
        <div>
          <div className="text-sm opacity-70 mb-1">発揮されるスキル効果</div>
          <div className="space-y-2">
            {(ts.effects || []).map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border-2 border-primary/30 bg-base-100 px-3 py-2"
                style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.02)" }}
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm">{e.effect || "(効果名不明)"}</div>
                  {e.detail ? <div className="text-xs opacity-70">{e.detail}</div> : null}
                </div>
                <div className="font-black tabular-nums ml-3">{e.value || "-"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 入れ替え（未発動時のみ） */}
        {Array.isArray(missing) && missing.length > 0 && swapList.length > 0 && (
          <div>
            <div className="text-xs opacity-70 mb-2">入れ替え</div>
            <div className="flex flex-col gap-2">
              {swapList.map(({ outId, inId }, idx) => (
                <div key={`${outId}->${inId}-${idx}`} className="flex items-center gap-3">
                  <div className="shrink-0"><TargetTile id={outId} /></div>
                  <div className="shrink-0" style={{ width: 24, textAlign: "center" }}>→</div>
                  <div className="shrink-0"><TargetTile id={inId} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====== （新規）タイプ絞り込み：type / type2（他の別名キーも） ====== */
// カードからタイプ候補をすべて取得（正規化済みと表示用のペア）
const TYPE_KEYS = ["type", "type2", "Type", "Type2", "タイプ", "タイプ2", "subtype", "SubType", "サブタイプ"];
function getTypeValues(card) {
  const results = [];
  for (const k of TYPE_KEYS) {
    if (card && Object.prototype.hasOwnProperty.call(card, k)) {
      const label = String(card[k] ?? "").trim();
      if (!label) continue;
      const key = norm(label);
      // 重複除去（key単位）
      if (!results.some((x) => x.key === key)) {
        results.push({ key, label });
      }
    }
  }
  return results; // 例: [{key:'テクニック', label:'テクニック'}, {key:'賢さ', label:'賢さ'}]
}

// 選択されたタイプにマッチするか（type または type2 などの候補いずれか一致）
const matchesType = (card, selectedKey) => {
  if (!selectedKey || selectedKey === "ALL") return true;
  return getTypeValues(card).some((t) => t.key === selectedKey);
};

// プールからタイプ一覧を動的抽出（初出の表示ラベルを採用）
function collectTypes(pool) {
  const map = new Map(); // key: 正規化キー, value: label
  for (const c of pool || []) {
    for (const t of getTypeValues(c)) {
      if (!map.has(t.key)) map.set(t.key, t.label);
    }
  }
  return Array.from(map, ([key, label]) => ({ key, label }));
}

// daisyUIで作るフィルタバー
function TypeFilterBar({ items, value, onChange }) {
  return (
    <div className="pt-5">
      <div className="text-sm mb-2">タイプで絞り込み</div>
        <div className="mt-2 text-xs text-base-content/70">
           ボタンをクリックすると、各タイプのカードのみ表示されます。
        </div>
      <div className="flex flex-wrap gap-2 pt-5">
        <button
          type="button"
          className={`btn btn-sm ${!value || value === "ALL" ? "btn-active" : "btn-ghost"}`}
          onClick={() => onChange("ALL")}
        >
          すべて
        </button>
        {items.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`btn btn-sm ${value === key ? "btn-active" : "btn-ghost"}`}
            onClick={() => onChange(key)}
            title={label}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* === ターゲットタイル（選手 or カード）— 幅70px固定 ================== */
function TargetTile({ id, muted = false }) {
  const isChar = !!getCharById(id);
  if (isChar) return <CharacterThumb id={id} muted={muted} width={70} />;

  const card = getSupportById(id);
  if (card) return <SupportCardThumb card={card} showName width={70} />;

  return <div className={`badge badge-outline ${muted ? "opacity-60" : ""}`} title="不明な対象">（不明な対象）</div>;
}

/* ====== ダイアログ用タイル/ピッカー ===================== */
// 編成欄に置くプレビュー（ダイアログと同じ 94px ベース、fillで均等余白）
function SupportCardSlot({ id, onClick, onRemove }) {
  const card = id ? getSupportById(id) : null;

  const Outer = ({ children, title }) => (
    <div style={{ width: SLOT_TILE_W }} title={title}>
      <div style={{ width: SLOT_TILE_W, padding: SLOT_TILE_PAD, borderRadius: 8, border: "2px solid #d1d5db", background: "#ffffff" }}>
        {children}
      </div>
    </div>
  );

  if (!card) {
    return (
      <div className="relative">
        <button type="button" className="rounded-xl block" onClick={onClick} title="サポートカードを追加" aria-label="サポートカードを追加">
          <Outer title="サポートカードを追加">
            <div style={{ width: "100%", aspectRatio: "499 / 640", position: "relative", overflow: "hidden", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center text-lg">＋</div>
            </div>
            <div style={{ fontSize: 10, marginTop: 4, lineHeight: 1.2, whiteSpace: "normal", wordBreak: "break-word", textAlign: "center" }}>card</div>
          </Outer>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button type="button" className="rounded-xl block" onClick={onClick} title={card.name} aria-label={card.name}>
        <Outer title={card.name}>
          {/* 画像側は枠線なし。外枠のみ枠線／内側は100%でフィット */}
          <SupportCardThumb card={card} showName fill />
        </Outer>
      </button>
      {id && <div className="absolute -top-2 -right-2"><CloseDot onClick={onRemove} title="カードを外す" /></div>}
    </div>
  );
}

// ダイアログのカードタイル（94px外枠 + 2px padding、内側はfillで100%）
function SupportCardTile({ card, selected, disabled, onToggle }) {
  const baseStyle = {
    width: CARD_TILE_W,
    padding: CARD_TILE_PAD,
    borderRadius: 8,
    border: "2px solid",
    borderColor: selected ? "#3b82f6" : "#d1d5db",
    background: selected ? "#e8f1ff" : "#ffffff",
    cursor: disabled && !selected ? "not-allowed" : "pointer",
    opacity: disabled && !selected ? 0.4 : 1,
    position: "relative",
    textAlign: "center",
  };
  return (
    <li key={card.id} onClick={disabled ? undefined : onToggle} style={baseStyle} title={card.name}>
      {/* 内側は枠線なし＋100%フィット。外枠のpaddingがそのまま均等余白になる */}
      <SupportCardThumb card={card} showName fill />
    </li>
  );
}

// ダイアログ・ピッカー
function SupportCardPicker({ pool, max, selectedIds, onChange }) {
  const set = new Set(selectedIds);
  const remain = Math.max(0, max - selectedIds.length);
  return (
    <div className="space-y-2">
      <div className="text-xs opacity-70">現在 {selectedIds.length} / {max}　{remain === 0 ? "(上限)" : ""}</div>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
        {pool.map((card) => {
          const isSelected = set.has(card.id);
          const disabled = !isSelected && selectedIds.length >= max;
          return (
            <SupportCardTile
              key={card.id}
              card={card}
              selected={isSelected}
              disabled={disabled}
              onToggle={() => {
                if (isSelected) onChange(selectedIds.filter((x) => x !== card.id));
                else {
                  if (selectedIds.length >= max) return;
                  onChange([...selectedIds, card.id]);
                }
              }}
            />
          );
        })}
      </ul>
    </div>
  );
}

function ExSupportPicker({ pool, selectedId, onChange }) {
  return (
    <div className="space-y-2">
      <div className="text-xs opacity-70">現在 {selectedId ? 1 : 0} / 1</div>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
        {pool.map((card) => {
          const isSelected = selectedId === card.id;
          return (
            <SupportCardTile
              key={card.id}
              card={card}
              selected={isSelected}
              disabled={false}
              onToggle={() => onChange(isSelected ? null : card.id)}
            />
          );
        })}
      </ul>
    </div>
  );
}

/* ================= メイン ================= */
export default function TrainingTool() {
  // ダイアログ
  const traineeDialogRef = useRef(null);
  const charDialogRef = useRef(null);
  const supportDialogRef = useRef(null);
  const exDialogRef = useRef(null);

  const {
    state: { selectedChars, selectedSupports, selectedExSupport },
    actions: { removeChar, setSelectedChars, removeSupport, setSelectedSupports, setExSupport },
    derived: {},
  } = useTrainingSkillsPipeline();

  // 育成選手（UIのみ）
  const [selectedTraineeId, setSelectedTraineeId] = useState(null);

  const selectedCharObjects = useMemo(
    () => selectedChars.map((id) => allChars.find((c) => norm(c.id) === norm(id))).filter(Boolean),
    [selectedChars]
  );

  const onSelectTraineeFromDialog = (list) => setSelectedTraineeId(list[0]?.id || null);
  const onSelectSupportCharsFromDialog = (list) => {
    const uniq = Array.from(new Set(list.map((c) => c.id))).slice(0, 5);
    setSelectedChars(uniq);
  };

  const clearAll = () => {
    setSelectedTraineeId(null);
    setSelectedChars([]);
    setSelectedSupports([]);
    setExSupport(null);
  };

  // サポートカードのダイアログ用
  const normalCards = useMemo(() => supportCards.filter((c) => c.kind === "support"), []);
  const exCards = useMemo(() => supportCards.filter((c) => c.kind === "ex"), []);

  // （新規）タイプ絞り込み state と候補一覧
  const [supportTypeKey, setSupportTypeKey] = useState("ALL");
  const [exTypeKey, setExTypeKey] = useState("ALL");
  const supportTypeItems = useMemo(() => collectTypes(normalCards), [normalCards]);
  const exTypeItems = useMemo(() => collectTypes(exCards), [exCards]);

  // （新規）絞り込み後プール（type / type2 などのいずれか一致）
  const filteredNormalCards = useMemo(
    () => (normalCards || []).filter((c) => matchesType(c, supportTypeKey)),
    [normalCards, supportTypeKey]
  );
  const filteredExCards = useMemo(
    () => (exCards || []).filter((c) => matchesType(c, exTypeKey)),
    [exCards, exTypeKey]
  );

  /* === trainingSkills を正規化 → 育成も含めて発動判定 === */
  const normalizedTrainingSkills = useMemo(
    () => (Array.isArray(sourceTrainingSkills) ? sourceTrainingSkills : []).map(normalizeTrainingSkillRow),
    []
  );

  const haveSet = useMemo(() => {
    return new Set([
      ...(selectedTraineeId ? [norm(selectedTraineeId)] : []),
      ...selectedChars.map(norm),
      ...selectedSupports.map(norm),
      ...(selectedExSupport ? [norm(selectedExSupport)] : []),
    ]);
  }, [selectedTraineeId, selectedChars, selectedSupports, selectedExSupport]);

  const allSlotsFilled = useMemo(() => {
    return Boolean(selectedTraineeId) &&
      selectedChars.length === 5 &&
      selectedSupports.length === 4 &&
      Boolean(selectedExSupport);
  }, [selectedTraineeId, selectedChars.length, selectedSupports.length, selectedExSupport]);

  const activatedWithTrainee = useMemo(
    () =>
      normalizedTrainingSkills.filter(
        (ts) => (ts.targets || []).length > 0 && (ts.targets || []).every((t) => haveSet.has(norm(t)))
      ),
    [normalizedTrainingSkills, haveSet]
  );

  const activatedEffectTotalsByEffect = useMemo(() => {
    const totals = new Map();
    for (const ts of activatedWithTrainee) {
      for (const e of (ts.effects || [])) {
        const key = (e.effect || "").trim();
        if (!key) continue;
        const add = parsePercentToNumber(e.value);
        totals.set(key, (totals.get(key) || 0) + add);
      }
    }
    return totals;
  }, [activatedWithTrainee]);

  const inactivatedWithTrainee = useMemo(() => {
    if (!allSlotsFilled) return [];
    const rows = normalizedTrainingSkills
      .map((ts) => {
        const targets = ts.targets || [];
        if (targets.length === 0) return null;
        const missing = targets.filter((t) => !haveSet.has(norm(t)));
        if (missing.length === 0) return null;
        const haveCount = targets.length - missing.length;
        return { ts, missing, haveCount, needCount: targets.length, missingCount: missing.length };
      })
      .filter(Boolean);

    rows.sort((a, b) => a.missingCount - b.missingCount || b.haveCount - a.haveCount);
    return rows.slice(0, 20);
  }, [normalizedTrainingSkills, haveSet, allSlotsFilled]);

  // デバッグ可視化
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__TSDBG__ = {
      selected: {
        trainee: selectedTraineeId,
        chars: [...selectedChars],
        supports: [...selectedSupports],
        ex: selectedExSupport,
      },
      haveSet: Array.from(haveSet),
      normalizedTrainingSkills,
      activatedWithTrainee,
      inactivatedWithTrainee,
      allSlotsFilled,
      totalsByEffect: Object.fromEntries(activatedEffectTotalsByEffect),
    };
    console.log("[TSDBG] exported to window.__TSDBG__", window.__TSDBG__);
  }, [
    selectedTraineeId,
    selectedChars,
    selectedSupports,
    selectedExSupport,
    haveSet,
    normalizedTrainingSkills,
    activatedWithTrainee,
    inactivatedWithTrainee,
    allSlotsFilled,
    activatedEffectTotalsByEffect,
  ]);

  /* ================= Render ================= */
  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="p-4 max-w-5xl mx-auto space-y-6">
        {/* 見出し */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">トレーニングスキル確認ツール</h1>
        </div>

        {/* サポート編成ボックス */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm">
          <div className="py-3 border-b border-base-300 flex items-center justify-between">
            <div className="font-semibold">サポート編成</div>
          </div>

        <div className="p-4 space-y-6">
          {/* 育成選手 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">育成選手</h3>
              <button className="btn btn-xs" onClick={() => traineeDialogRef.current?.showModal()}>＋ 選ぶ</button>
            </div>
            <div className="flex gap-3">
              <CharacterSlot
                id={selectedTraineeId}
                onClick={() => traineeDialogRef.current?.showModal()}
                onRemove={() => setSelectedTraineeId(null)}
              />
            </div>
          </section>

          {/* サポート選手（5枠） */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">サポート選手</h3>
              <button className="btn btn-xs" onClick={() => charDialogRef.current?.showModal()}>＋ 選ぶ</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 5 }).map((_, i) => {
                const id = selectedChars[i];
                return (
                  <CharacterSlot
                    key={i}
                    id={id}
                    onClick={() => charDialogRef.current?.showModal()}
                    onRemove={() => id && removeChar(id)}
                  />
                );
              })}
            </div>
            <div className="mt-2 text-xs text-base-content/70">
              ※ 育成選手はダイアログ上でグレー表示＆クリック不可（同名も不可）です。
            </div>
          </section>

          {/* スペシャルサポートカード（4） */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">スペシャルサポートカード</h3>
              <button className="btn btn-xs" onClick={() => supportDialogRef.current?.showModal()}>＋ 追加</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => {
                const id = selectedSupports[i];
                return (
                  <SupportCardSlot
                    key={i}
                    id={id}
                    onClick={() => supportDialogRef.current?.showModal()}
                    onRemove={() => id && removeSupport(id)}
                  />
                );
              })}
            </div>
          </section>

          {/* EXサポートカード（1） */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">EXサポートカード</h3>
              <button className="btn btn-xs" onClick={() => exDialogRef.current?.showModal()}>＋ 追加</button>
            </div>
            <div className="flex flex-wrap gap-3">
              <SupportCardSlot
                id={selectedExSupport || null}
                onClick={() => exDialogRef.current?.showModal()}
                onRemove={() => setExSupport(null)}
              />
            </div>
          </section>

          {/* ボタン行（不要分を削除） */}
          <div className="pt-2">
            <button className="btn" onClick={clearAll}>リセット</button>
          </div>
        </div>
        </div>

        {/* 発動（合計ボックス＋一覧） */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">発動スキル（{activatedWithTrainee.length}）</h2>

          {activatedEffectTotalsByEffect.size > 0 && (
            <div className="text-sm p-3 rounded bg-base-200/50 border border-base-300">
              <div className="font-semibold mb-1">発動スキルの合計</div>
              <ul className="flex flex-wrap gap-2">
                {Array.from(activatedEffectTotalsByEffect.entries()).map(([effect, total]) => (
                  <li key={effect} className="badge badge-outline">
                    {effect}: {total}%
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {activatedWithTrainee.map((ts) => (
              <TrainingSkillCard
                key={ts.key}
                ts={ts}
                selectedSupports={selectedSupports}
                selectedExSupport={selectedExSupport}
              />
            ))}
            {activatedWithTrainee.length === 0 && <div className="text-sm opacity-70">該当なし</div>}
          </div>
        </section>

        {/* 似た組み合わせのスキル（未発動・全枠が埋まった時のみ） */}
        {allSlotsFilled ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">
              似た組み合わせのスキル
              <span className="ml-2 text-sm opacity-70">
                あと1で発動: {inactivatedWithTrainee.filter(x => x.missing.length === 1).length}件
              </span>
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {inactivatedWithTrainee.map(({ ts, missing }) => (
                <TrainingSkillCard
                  key={ts.key}
                  ts={ts}
                  missing={missing}
                  selectedSupports={selectedSupports}
                  selectedExSupport={selectedExSupport}
                />
              ))}
              {inactivatedWithTrainee.length === 0 && <div className="text-sm opacity-70">該当なし</div>}
            </div>
          </section>
        ) : (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">似た組み合わせのスキル</h2>
            <div className="text-sm opacity-70">
              ※ 育成1 / サポ選手5 / サポカード4 / EX1 がすべて選択されたときに表示されます。
            </div>
          </section>
        )}
      </section>

      {/* ===== モーダル ===== */}
      {/* 育成選手（max 1） */}
      <dialog ref={traineeDialogRef} className="modal">
        <div className="modal-box max-w-5xl">
          <h3 className="font-bold text-lg">育成選手を選ぶ（1）</h3>
          <div className="mt-1 text-xs opacity-70">現在 {selectedTraineeId ? 1 : 0} / 1</div>
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            <CharacterSelector
              selectedCharacters={selectedTraineeId ? [allChars.find((c) => norm(c.id) === norm(selectedTraineeId))].filter(Boolean) : []}
              onSelectCharacter={onSelectTraineeFromDialog}
              maxSelectable={1}
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedTraineeId(null)}>未選択</button>
            <form method="dialog"><button className="btn">閉じる</button></form>
            <button type="button" className="btn btn-primary" onClick={() => traineeDialogRef.current?.close()}>決定</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* サポート選手 */}
      <dialog ref={charDialogRef} className="modal">
        <div className="modal-box max-w-5xl">
          <h3 className="font-bold text-lg">サポート選手を選ぶ（最大5）</h3>
          <div className="mt-1 text-xs opacity-70">現在 {selectedChars.length} / 5</div>
          <div className="mt-4 max-h-[70vh] overflow-y-auto">
            <CharacterSelector
              selectedCharacters={selectedCharObjects}
              onSelectCharacter={onSelectSupportCharsFromDialog}
              maxSelectable={5}
              lockedSelectedIds={selectedTraineeId ? [selectedTraineeId] : []}
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedChars([])}>全解除</button>
            <form method="dialog"><button className="btn">閉じる</button></form>
            <button type="button" className="btn btn-primary" onClick={() => charDialogRef.current?.close()}>決定</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* スペシャルサポートカード（UR/SSR 4枚まで） */}
      <dialog ref={supportDialogRef} className="modal">
        <div
          className="modal-box max-w-5xl"
          style={{ display: "flex", flexDirection: "column", maxHeight: "80vh", paddingBottom: 0 }}
        >
          <h3 className="font-bold text-lg pt-4">スペシャルサポートカードを選ぶ（最大4）</h3>

          <div className="mt-2 text-xs text-base-content/70">
            ※ 比較的最近追加された、効果量の高いカードのみ表示しています。（具体的には画像の表示されているカードのみ。）
          </div>

          <div className="mt-2 text-xs text-base-content/70">
            全てレベルMAXの時の効果量で表示されます。
          </div>

          {/* ★ 追加：タイプ絞り込みバー */}
          <TypeFilterBar items={supportTypeItems} value={supportTypeKey} onChange={setSupportTypeKey} />

          <div className="mt-3" style={{ overflowY: "auto", padding: "5px", flex: "1 1 auto" }}>
            <SupportCardPicker
              pool={filteredNormalCards} // ← 絞り込み後のプール
              max={4}
              selectedIds={selectedSupports}
              onChange={(nextIds) => setSelectedSupports(nextIds.slice(0, 4))}
            />
            <div style={{ height: 12 }} />
          </div>

          <div
            className="modal-action"
            style={{
              position: "sticky",
              bottom: 0,
              background: "var(--fallback-b1, oklch(var(--b1)))",
              borderTop: "1px solid rgba(0,0,0,0.08)",
              padding: "12px 5px",
              marginTop: 0,
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedSupports([])}>全解除</button>
            <form method="dialog"><button className="btn">閉じる</button></form>
            <button type="button" className="btn btn-primary" onClick={() => supportDialogRef.current?.close()}>決定</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* EXサポートカード（1枚） */}
      <dialog ref={exDialogRef} className="modal">
        <div
          className="modal-box max-w-5xl"
          style={{ display: "flex", flexDirection: "column", maxHeight: "80vh", paddingBottom: 0 }}
        >
          <h3 className="font-bold text-lg pt-4">EXサポートカードを選ぶ（1）</h3>

          {/* ★ 追加：タイプ絞り込みバー */}
          <TypeFilterBar items={exTypeItems} value={exTypeKey} onChange={setExTypeKey} />

          <div className="mt-3" style={{ overflowY: "auto", padding: "0", flex: "1 1 auto" }}>
            <ExSupportPicker
              pool={filteredExCards} // ← 絞り込み後のプール
              selectedId={selectedExSupport || null}
              onChange={(id) => setExSupport(id)}
            />
            <div style={{ height: 12 }} />
          </div>

          <div
            className="modal-action"
            style={{
              position: "sticky",
              bottom: 0,
              background: "var(--fallback-b1, oklch(var(--b1)))",
              borderTop: "1px solid rgba(0,0,0,0.08)",
              padding: "12px 5px",
              marginTop: 0,
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={() => setExSupport(null)}>未選択</button>
            <form method="dialog"><button className="btn">閉じる</button></form>
            <button type="button" className="btn btn-primary" onClick={() => exDialogRef.current?.close()}>決定</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>
    </TwoColumnLayout>
  );
}
