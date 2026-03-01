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
// SP-UR*** / SP-SSR*** / SP-EX***（互換用）/ EXSP-UR*** / EXSP-SSR*** をサポート
const isSupportId = (s) =>
  /^(?:SP-(?:UR|SSR|EX)\d{3}|EXSP-(?:UR|SSR)\d{3})$/i.test(String(s || ""));
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
  return <div className={`absolute top-0.5 left-0.5 ${color} text-white text-[9px] font-black px-0.5 rounded`}>{rarity}</div>;
}
function TypeBadgeMini({ type }) {
  return <div className="absolute bottom-0.5 left-0.5 text-[9px] px-1 py-[1px] rounded bg-base-100/80 border border-base-200">{type}</div>;
}

/* ====== 定数（サイズ統一） ====== */
const CARD_TILE_W = 80;         // ダイアログ/編成欄のカード外枠の幅
const CARD_TILE_PAD = 0;        // 外枠のpadding
const SLOT_TILE_W = 80;         // 編成欄のカード外枠の幅（=94で据え置き）
const SLOT_TILE_PAD = 0;

/* === 小型サムネ（カード/選手） ===================================== */
// 内側は枠線なし。fillで親幅にフィットさせ、外枠のpadding分だけ均等余白にする
function SupportCardThumb({ card, showName = false, width, fill = false }) {
  const { id, name, rarity, type } = card;
  const W = typeof width === "number" ? width : Number(width) || 80;
  const NAME_FONT_SIZE = 10;
  const NAME_LINES = 2;
  const NAME_LINE_HEIGHT = 1.2;
  const NAME_BOX_PX = Math.round(NAME_FONT_SIZE * NAME_LINE_HEIGHT * NAME_LINES);

  const src = `/images/supportcard/${id}.png`;

  return (
    <div style={{ width: fill ? "100%" : W, textAlign: "center" }} title={name}>
      <div
        style={{
          width: fill ? "100%" : W,
          height: W,
          borderRadius: 8,
          overflow: "hidden",
          background: "#fff",
          display: "inline-block",
          position: "relative",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <img
          src={src}
          alt={name}
          onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }}
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{ position: "absolute", top: 4, left: 6 }}>
          <RarityBadgeMini rarity={rarity} />
        </div>
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            fontSize: 9,
            lineHeight: 1,
            padding: "2px 4px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.88)",
            border: "1px solid rgba(0,0,0,0.06)",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {type}
        </div>
      </div>

      {showName && !fill ? (
        <div
          style={{
            fontSize: NAME_FONT_SIZE,
            marginTop: 6,
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
      ) : null}
    </div>
  );
}

// 選手の小型タイル（画像 + 名前）。showName=false で名前領域を非表示にする
function CharacterThumb({ id, muted = false, width = 80, showName = true }) {
  const c = getCharById(id);
  const name = (c?.name || c?.title || "") || "";
  const IMG_SIZE = typeof width === "number" ? width : Number(width) || 80;
  const NAME_FONT_SIZE = 10;
  const NAME_LINES = 2;
  const NAME_LINE_HEIGHT = 1.2;
  const NAME_BOX_PX = Math.round(NAME_FONT_SIZE * NAME_LINE_HEIGHT * NAME_LINES);
  const src = `/images/${id}.png`;

  return (
    <div className={muted ? "opacity-60" : ""} style={{ width: IMG_SIZE, textAlign: "center" }} title={name}>
      <div
        style={{
          width: IMG_SIZE,
          height: IMG_SIZE,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.06)",
          background: "#fff",
          display: "inline-block",
        }}
      >
        <img
          src={src}
          alt={name}
          onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }}
          loading="lazy"
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      {showName ? (
        <div
          style={{
            fontSize: NAME_FONT_SIZE,
            marginTop: 6,
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
      ) : null}
    </div>
  );
}

// ターゲットタイル（選手 or カード） — 固定ボックスに統一
function TargetTile({ id, muted = false, width = 80, showName = true }) {
  const W = typeof width === "number" ? width : Number(width) || 80;
  const isChar = !!getCharById(id);
  if (isChar) return (
    <div style={{ width: W }}>
      <CharacterThumb id={id} muted={muted} width={W} showName={showName} />
    </div>
  );

  const card = getSupportById(id);
  if (card) return (
    <div style={{ width: W }}>
      <SupportCardThumb card={card} showName={showName} width={W} />
    </div>
  );

  return (
    <div
      className={`badge badge-outline ${muted ? "opacity-60" : ""}`}
      title="不明な対象"
      style={{ width: W, height: W, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
    >
      （不明な対象）
    </div>
  );
}

/* =================================================================== */

/* ====== ここから：CharacterSlot ====== */
function CharacterSlot({ id, onClick, onRemove }) {
  const name = id ? getCharNameById(id) : "";
  return (
    <div className="relative w-full aspect-square rounded-xl border shadow-sm bg-base-100 border-base-300">
      <button
        type="button"
        className="w-full h-full flex items-center justify-center rounded-xl"
        onClick={onClick}
        title={id ? name : "選手を追加"}
        aria-label={id ? name : "選手を追加"}
      >
        {id ? (
          <img
            src={`/images/${id}.png`}
            alt={name}
            onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }}
            className="w-full h-full object-cover rounded-xl"
          />
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

  const targets = ts.targets || [];
  const effects = ts.effects || [];
  const missingSet = new Set((missing || []).map((m) => norm(m)));

  return (
    <article
      className="rounded-lg border border-base-200 bg-white shadow-sm"
      style={{ overflow: "visible", display: "flex", flexDirection: "column" }}
    >
      <div className="p-3 space-y-4 flex-1">
        {/* 組み合わせ */}
        <div>
          <div className="text-sm font-medium mb-2">組み合わせ</div>
          <div className="flex gap-3 overflow-x-auto py-1">
            {targets.map((id) => (
              <div key={id} className="shrink-0 flex flex-col items-center" style={{ width: 72 }}>
                {/* 枠線・透過を削除して画像を枠内に収める（見た目の崩れを防止） */}
                <div className="rounded-md overflow-hidden" style={{ width: 72, height: 72 }}>
                  <TargetTile id={id} />
                </div>
                <div className="text-[11px] text-center text-base-content/70 mt-1" style={{ width: 72 }}>
                  {getCharNameById(id) || getSupportName(id) || ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 効果：テキスト幅を十分に確保するレイアウトに変更 */}
        <div>
          <div className="text-xs opacity-70 mb-2">発揮されるスキル効果</div>
          <div className="space-y-2">
            {effects.map((e, i) => (
              <div
                key={i}
                className="p-3 rounded-md bg-base-100"
                style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.03)" }}
              >
                {/* gridで値列を auto にして、効果名/詳細は十分な幅(1fr)を確保 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
                  <div>
                    <div className="text-sm font-medium">{e.effect || ""}</div>
                    {e.detail ? (
                      <div className="text-xs opacity-70 mt-1 whitespace-pre-wrap leading-tight">{e.detail}</div>
                    ) : null}
                  </div>
                  <div className="ml-3 text-sm font-semibold tabular-nums flex-shrink-0 text-right">
                    {e.value || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 入れ替え候補（表示は候補があるときのみ） */}
        {Array.isArray(missing) && missing.length > 0 && swapList.length > 0 && (
          <div>
            <div className="text-xs opacity-70 mb-2">入れ替え候補</div>
            <div className="flex flex-wrap gap-3 items-center">
              {swapList.map(({ outId, inId }, idx) => (
                <div
                  key={`${outId}->${inId}-${idx}`}
                  className="flex items-center gap-4 bg-base-100 px-3 py-2 rounded-md"
                  title={`${getSupportName(outId) || getCharNameById(outId) || outId} → ${getSupportName(inId) || getCharNameById(inId) || inId}`}
                >
                  {/* 出る側：画像＋下に名前（標準サイズで分かりやすく） */}
                  <div className="flex flex-col items-center" style={{ width: 72 }}>
                    <div className="w-[72px] h-[72px] overflow-hidden rounded-md">
                      <TargetTile id={outId} width={72, 72} showName={true} />
                    </div>
                    <div className="text-[11px] text-center text-base-content/70 mt-2 truncate" style={{ width: 72 }}>
                      {getSupportName(outId) || getCharNameById(outId) || ""}
                    </div>
                  </div>

                  {/* 大きめの矢印で A → B を明確に */}
                  <div className="text-lg text-base-content/60 mx-1" aria-hidden>→</div>

                  {/* 入れる側：画像＋下に名前 */}
                  <div className="flex flex-col items-center" style={{ width: 72 }}>
                    <div className="w-[72px] h-[72px] overflow-hidden rounded-md">
                      <TargetTile id={inId} width={72, 72} showName={true} />
                    </div>
                    <div className="text-[11px] text-center text-base-content/70 mt-2 truncate" style={{ width: 72 }}>
                      {getSupportName(inId) || getCharNameById(inId) || ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* ====== （新規）タイプ絞り込みユーティリティ（汎用化） ====== */
// 汎用：keys 配列で参照するフィールドを切り替えられるようにする
function getTypeValuesFrom(item, keys) {
  const results = [];
  for (const k of keys) {
    if (item && Object.prototype.hasOwnProperty.call(item, k)) {
      const raw = String(item[k] ?? "").trim();
      if (!raw) continue;
      const key = norm(raw);
      if (!results.some((x) => x === key)) results.push(key);
    }
  }
  return results; // 例: ['賢さ','スピード']
}

// 選択されたタイプにマッチするか（渡された keys のいずれか一致）
const matchesType = (item, selectedKey, keys) => {
  if (!selectedKey || selectedKey === "ALL") return true;
  if (!Array.isArray(keys) || keys.length === 0) return true;
  const vals = getTypeValuesFrom(item, keys);
  return vals.some((v) => v === norm(selectedKey));
};

// プールからタイプ一覧を動的抽出（"ALL" はここで付けない。UI側のボタンと重複するため）
function collectTypes(pool, keys) {
  const map = new Map();
  for (const item of pool || []) {
    const vals = getTypeValuesFrom(item, keys);
    for (const rawKey of vals) {
      if (!map.has(rawKey)) map.set(rawKey, rawKey);
    }
  }
  // TypeFilterBar は先頭に「すべて」を自前で出すのでここでは追加しない
  const items = [];
  for (const [key, label] of map.entries()) {
    items.push({ key, label }); // label = key（表示は大文字化済みで問題あれば元ラベルを渡す実装に変更可）
  }
  return items;
}

// プールからレアリティ一覧を抽出（表示ラベルは ★n、降順で表示）
function collectRarities(pool) {
  const set = new Set();
  for (const item of pool || []) {
    if (item && (item.rarity !== undefined && item.rarity !== null && String(item.rarity).trim() !== "")) {
      set.add(String(item.rarity).trim());
    }
  }
  const arr = Array.from(set).sort((a, b) => Number(b) - Number(a)); // 降順（例: '4','3'）
  return arr.map((r) => ({ key: r, label: `★${r}` }));
}

/* daisyUIで作るフィルタバー */
function TypeFilterBar({ items, value, onChange, heading = null }) {
  return (
    <div className="pt-2">
      {heading ? <div className="text-sm mb-2">{heading}</div> : null}
      {/* 折り返しは許容するが見た目を整える */}
      <div className="type-filter-bar" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }} aria-label={heading ? `${heading} のフィルタ` : "フィルタ"}>
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

/* ====== ダイアログ用タイル/ピッカー ===================== */
// 編成欄に置くプレビュー（レスポンシブ対応）
function SupportCardSlot({ id, onClick, onRemove }) {
  const card = id ? getSupportById(id) : null;

  if (!card) {
    return (
      <div className="relative w-full" style={{ aspectRatio: "499 / 640" }}>
        <button type="button" className="w-full h-full rounded-xl border-2 border-base-300 bg-white flex items-center justify-center" onClick={onClick} title="サポートカードを追加" aria-label="サポートカードを追加">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center text-lg">＋</div>
            <div className="text-[10px] mt-1">card</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: "499 / 640" }}>
      <button type="button" className="w-full h-full rounded-xl border-2 border-base-300 bg-white overflow-hidden" onClick={onClick} title={card.name} aria-label={card.name}>
        <img
          src={`/images/supportcard/${id}.png`}
          alt={card.name}
          onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }}
          className="w-full h-full object-contain"
        />
      </button>
      <div className="absolute -top-2 -right-2"><CloseDot onClick={onRemove} title="カードを外す" /></div>
    </div>
  );
}

// ダイアログのカードタイル（94px外枠 + 2px padding、内側はfillで100%）
function SupportCardTile({ card, selected, disabled, onToggle }) {
  const baseStyle = {
    width: CARD_TILE_W,                 // 固定幅（px）
    minWidth: CARD_TILE_W,
    maxWidth: CARD_TILE_W,
    boxSizing: "border-box",            // padding/border を幅に含める
    padding: CARD_TILE_PAD,             // 0 にして余白は内側で制御
    borderRadius: 8,
    border: "2px solid",
    borderColor: selected ? "#3b82f6" : "#d1d5db",
    background: selected ? "#e8f1ff" : "#ffffff",
    cursor: disabled && !selected ? "not-allowed" : "pointer",
    opacity: disabled && !selected ? 0.4 : 1,
    position: "relative",
    textAlign: "center",
    display: "inline-block",            // Grid/Flex の影響を受けにくくする
    verticalAlign: "top",
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
      <ul style={{ display: "flex", flexWrap: "wrap", gap: 4, listStyle: "none", padding: 0, margin: 0 }}>
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
  // スマホ用プレビュー表示制御
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  
  const selectedCharObjects = useMemo(
    () => selectedChars.map((id) => allChars.find((c) => norm(c.id) === norm(id))).filter(Boolean),
    [selectedChars]
  );

  // 育成/サポート選手ダイアログ用のソート：プレフィックス(B001等)昇順、同プレフィックス内はサフィックス(03,04,10...)を降順に
  const sortedAllCharsForDialogs = useMemo(() => {
    const parseId = (id) => {
      const s = String(id || "");
      const [pref = s, suf = "0"] = s.split("-");
      const sufNum = parseInt(String(suf).replace(/\D/g, ""), 10) || 0;
      return { pref, sufNum };
    };
    return [...allChars].sort((a, b) => {
      const A = parseId(a.id);
      const B = parseId(b.id);
      if (A.pref < B.pref) return -1;
      if (A.pref > B.pref) return 1;
      // 同プレフィックスならサフィックス数値を降順
      return B.sufNum - A.sufNum;
    });
  }, [allChars]);
  
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
  // 追加：育成選手 / サポート選手 用のタイプ絞り込み state
  const [traineeTypeKey, setTraineeTypeKey] = useState("ALL");
  const [charTypeKey, setCharTypeKey] = useState("ALL");
  // 追加：レアリティ絞り込み state（育成選手 / サポート選手）
  const [traineeRarityKey, setTraineeRarityKey] = useState("ALL");
  const [charRarityKey, setCharRarityKey] = useState("ALL");
  // サポートカードは card.type / type2 系を参照（従来の挙動）
  const SUPPORT_TYPE_KEYS = [
    "type", "type2", "Type", "Type2",
    "タイプ", "タイプ2",
    "subtype", "SubType", "サブタイプ"
  ];
  // キャラクターは card1/card2/card3 を参照
  const CHAR_TYPE_KEYS = ["card1", "card2", "card3", "カード1", "カード2", "カード3"];

  const supportTypeItems = useMemo(() => collectTypes(normalCards, SUPPORT_TYPE_KEYS), [normalCards]);
  const exTypeItems = useMemo(() => collectTypes(exCards, SUPPORT_TYPE_KEYS), [exCards]);
  const traineeTypeItems = useMemo(() => collectTypes(allChars, CHAR_TYPE_KEYS), [allChars]);
  // 共通：育成/サポート用レアリティ候補（例: {key:'3', label:'★3'}）
  const rarityItems = useMemo(() => collectRarities(allChars), [allChars]);
  const charTypeItems = traineeTypeItems;
 
  // （新規）絞り込み後プール（type / type2 などのいずれか一致）
  const filteredNormalCards = useMemo(
    () => (normalCards || []).filter((c) => matchesType(c, supportTypeKey, SUPPORT_TYPE_KEYS)),
    [normalCards, supportTypeKey]
  );
  const filteredExCards = useMemo(
    () => (exCards || []).filter((c) => matchesType(c, exTypeKey, SUPPORT_TYPE_KEYS)),
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
    <>
      <style dangerouslySetInnerHTML={{ __html: _trainingToolSPStyles }} />
      <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="max-w-5xl mx-auto space-y-6">
        {/* 見出し */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">トレーニングスキル確認ツール</h1>
        </div>

        {/* サポート編成ボックス */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm">
          <div className="p-3 border-b border-base-300 flex items-center justify-between">
            <div className="font-semibold">サポート編成</div>
          </div>

        <div className="p-3 space-y-6">
          {/* 育成選手 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">育成選手</h3>
              <button className="btn btn-xs" onClick={() => traineeDialogRef.current?.showModal()}>＋ 選ぶ</button>
            </div>
            <div className="flex gap-3">
              <div style={{ width: 80 }}>
                <CharacterSlot
                  id={selectedTraineeId}
                  onClick={() => traineeDialogRef.current?.showModal()}
                  onRemove={() => setSelectedTraineeId(null)}
                />
              </div>
            </div>
          </section>

          {/* サポート選手（5枠） */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">サポート選手</h3>
              <button className="btn btn-xs" onClick={() => charDialogRef.current?.showModal()}>＋ 選ぶ</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "4px", maxWidth: "100%" }}>
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
          </section>

          {/* スペシャルサポートカード（4） */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">スペシャルサポートカード</h3>
              <button className="btn btn-xs" onClick={() => supportDialogRef.current?.showModal()}>＋ 追加</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "4px", maxWidth: "100%" }}>
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
            <div className="flex flex-wrap gap-2">
              <div style={{ width: 80 }}>
                <SupportCardSlot
                  id={selectedExSupport || null}
                  onClick={() => exDialogRef.current?.showModal()}
                  onRemove={() => setExSupport(null)}
                />
              </div>
            </div>
          </section>

          {/* ボタン行（不要分を削除） */}
          <div className="pt-2">
            <button className="btn" onClick={clearAll}>リセット</button>
          </div>
        </div>
        </div>

        {/* 発動（合計ボックス＋一覧） */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">発動スキル（{activatedWithTrainee.length}）</h2>
              <div className="mt-1 text-xs text-base-content/70">
                ※ 表示はレベルMAX想定。レベルで発動数・効果量が変動します。
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            {/* 左：結果一覧（縦リスト） */}
            <div>
              {/* 合計バッジ（カード風） */}
              {activatedEffectTotalsByEffect.size > 0 && (
                <div className="mb-4 p-4 rounded-lg border border-base-300 bg-base-200/40">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">発動スキルの効果合計</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            Array.from(activatedEffectTotalsByEffect.entries()).map(([k, v]) => `${k}: ${v}%`).join("\n")
                          )
                        }
                      >
                        コピー
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from(activatedEffectTotalsByEffect.entries()).map(([effect, total]) => (
                      <div key={effect} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                        {effect}: {total}%
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* スキルカード一覧（縦に並べて見やすく） */}
              <div className="flex flex-col gap-4">
                {activatedWithTrainee.length > 0 ? (
                  activatedWithTrainee.map((ts) => (
                    <div key={ts.key} className="w-full">
                      <TrainingSkillCard
                        ts={ts}
                        selectedSupports={selectedSupports}
                        selectedExSupport={selectedExSupport}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-sm opacity-70">該当なし</div>
                )}
              </div>
            </div>

            {/* 右：集計 / 編成プレビュー（sticky） */}
            <aside className="hidden md:block prose-sm sticky top-24 self-start rounded-lg p-4"
              style={{ border: "1px solid rgba(59,130,246,0.12)", background: "rgba(59,130,246,0.03)" }}>
              <div className="mb-3">
                <div className="text-sm font-medium">現在の編成</div>
                <div className="mt-3 space-y-2 text-sm">
                  {/* 育成選手（サムネ） */}
                  <div>
                    <div className="text-xs opacity-70 mb-1">育成選手</div>
                    <div className="flex items-center gap-2">
                      {selectedTraineeId ? (
                        <div style={{ width: 48 }}>
                          <CharImg id={selectedTraineeId} alt={getCharNameById(selectedTraineeId)} size={48} />
                        </div>
                      ) : (
                        <div className="text-xs opacity-60">未選択</div>
                      )}
                      {/* 育成選手のID表示を削除（画像のみ表示） */}
                    </div>
                  </div>

                  {/* サポート選手（小サムネ横並び） */}
                  <div>
                    <div className="text-xs opacity-70 mb-1">サポート選手</div>
                    <div className="flex items-center gap-2">
                      {selectedChars.length > 0 ? (
                        selectedChars.map((id) => (
                          <div key={id} style={{ width: 40 }}>
                            <CharImg id={id} alt={getCharNameById(id)} size={40} />
                          </div>
                        ))
                      ) : (
                        <div className="text-xs opacity-60">未選択</div>
                      )}
                    </div>
                    <div className="text-xs opacity-60 mt-1">{selectedChars.length} / 5</div>
                  </div>

                  {/* スペシャルサポートカード（小サムネ） */}
                  <div>
                    <div className="text-xs opacity-70 mb-1">スペシャルサポートカード</div>
                    <div className="flex items-center gap-2">
                      {selectedSupports.length > 0 ? (
                        selectedSupports.map((id) => (
                          <div key={id} style={{ width: 48 }}>
                            <SupportImg id={id} alt={getSupportName(id)} className="rounded-sm" />
                          </div>
                        ))
                      ) : (
                        <div className="text-xs opacity-60">未選択</div>
                      )}
                    </div>
                    <div className="text-xs opacity-60 mt-1">{selectedSupports.length} / 4</div>
                  </div>

                  {/* EXサポートカード */}
                  <div>
                    <div className="text-xs opacity-70 mb-1">EXサポートカード</div>
                    <div className="flex items-center gap-2">
                      {selectedExSupport ? (
                        <div style={{ width: 48 }}>
                          <SupportImg id={selectedExSupport} alt={getSupportName(selectedExSupport)} className="rounded-sm" />
                        </div>
                      ) : (
                        <div className="text-xs opacity-60">未選択</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {/* 補足テキストは不要のため削除 */}
              </div>
            </aside>
            {/* --- スマホ用：右下固定プレビューボタン + パネル --- */}
            <div className="md:hidden">
              <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-full shadow-lg"
                  onClick={() => setMobilePreviewOpen((s) => !s)}
                  aria-expanded={mobilePreviewOpen}
                  aria-controls="mobile-preview-panel"
                  title="現在の編成を表示"
                >
                  編成表示
                </button>

                {mobilePreviewOpen && (
                  <div
                    id="mobile-preview-panel"
                    className="w-72 max-h-[60vh] overflow-y-auto rounded-lg p-3 bg-white border shadow-lg"
                    role="dialog"
                    aria-modal="false"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">現在の編成</div>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => setMobilePreviewOpen(false)}>閉じる</button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-xs opacity-70 mb-1">育成選手</div>
                        <div className="flex items-center gap-2">
                          {selectedTraineeId ? (
                            <button className="p-0" onClick={() => traineeDialogRef.current?.showModal()}>
                              <div style={{ width: 56 }}>
                                <CharImg id={selectedTraineeId} alt={getCharNameById(selectedTraineeId)} size={56} />
                              </div>
                            </button>
                          ) : (
                            <div className="text-xs opacity-60">未選択</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-70 mb-1">サポート選手</div>
                        <div className="flex items-center gap-2">
                          {selectedChars.length > 0 ? (
                            selectedChars.map((id) => (
                              <button key={id} className="p-0" onClick={() => charDialogRef.current?.showModal()}>
                                <div style={{ width: 40 }}>
                                  <CharImg id={id} alt={getCharNameById(id)} size={40} />
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="text-xs opacity-60">未選択</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-70 mb-1">スペシャルサポートカード</div>
                        <div className="flex items-center gap-2">
                          {selectedSupports.length > 0 ? (
                            selectedSupports.map((id) => (
                              <button key={id} className="p-0" onClick={() => supportDialogRef.current?.showModal()}>
                                <div style={{ width: 44 }}>
                                  <SupportImg id={id} alt={getSupportName(id)} className="rounded-sm" />
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="text-xs opacity-60">未選択</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs opacity-70 mb-1">EXサポートカード</div>
                        <div className="flex items-center gap-2">
                          {selectedExSupport ? (
                            <button className="p-0" onClick={() => exDialogRef.current?.showModal()}>
                              <div style={{ width: 44 }}>
                                <SupportImg id={selectedExSupport} alt={getSupportName(selectedExSupport)} className="rounded-sm" />
                              </div>
                            </button>
                          ) : (
                            <div className="text-xs opacity-60">未選択</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="divider mt-20"></div>

        {/* 似た組み合わせのスキル（未発動・全枠が埋まった時のみ） */}
        {allSlotsFilled ? (
          <section className="space-y-3 mt-20">
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
        <div className="modal-box max-w-4xl p-4 max-h-[90vh] flex flex-col">
           <div className="mb-3">
             <h3 className="font-bold text-lg">育成選手を選ぶ（1）</h3>
             <div className="text-xs opacity-70 mt-1">現在 {selectedTraineeId ? 1 : 0} / 1</div>
           </div>
 
          <div className="flex-1 min-h-0 grid grid-cols-1 gap-3">
            <div className="rounded-lg p-3 border border-base-300 bg-base-100">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium mb-1">タイプ</div>
                  <TypeFilterBar items={traineeTypeItems} value={traineeTypeKey} onChange={setTraineeTypeKey} />
                </div>
                <div>
                  <div className="text-xs font-medium mb-1">レアリティ</div>
                  <TypeFilterBar items={rarityItems} value={traineeRarityKey} onChange={setTraineeRarityKey} />
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
               <CharacterSelector
                 selectedCharacters={selectedTraineeId ? [allChars.find((c) => norm(c.id) === norm(selectedTraineeId))].filter(Boolean) : []}
                 onSelectCharacter={onSelectTraineeFromDialog}
                 maxSelectable={1}
                 typeKey={traineeTypeKey}
                 rarityKey={traineeRarityKey}
                 allChars={sortedAllCharsForDialogs}
               />
             </div>
           </div>
 
          <div className="modal-action mt-3 sticky bottom-0 bg-base-100 pt-3 border-t border-base-300 px-4 pb-[env(safe-area-inset-bottom)]">
             <button type="button" className="btn btn-ghost" onClick={() => setSelectedTraineeId(null)}>未選択</button>
             <form method="dialog"><button className="btn">閉じる</button></form>
             <button type="button" className="btn btn-primary" onClick={() => traineeDialogRef.current?.close()}>決定</button>
           </div>
         </div>
         <form method="dialog" className="modal-backdrop"><button>close</button></form>
       </dialog>
      
      {/* サポート選手 */}
      <dialog ref={charDialogRef} className="modal">
        <div className="modal-box max-w-4xl p-4 max-h-[90vh] flex flex-col">
          <div className="mb-3">
            <h3 className="font-bold text-lg">サポート選手を選ぶ（最大5）</h3>
            <div className="text-xs opacity-70 mt-1">現在 {selectedChars.length} / 5</div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 gap-3">
            <div className="rounded-lg p-3 border border-base-300 bg-base-100">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium mb-1">タイプ</div>
                  <TypeFilterBar items={charTypeItems} value={charTypeKey} onChange={setCharTypeKey} />
                </div>
                <div>
                  <div className="text-xs font-medium mb-1">レアリティ</div>
                  <TypeFilterBar items={rarityItems} value={charRarityKey} onChange={setCharRarityKey} />
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <CharacterSelector
                selectedCharacters={selectedCharObjects}
                onSelectCharacter={onSelectSupportCharsFromDialog}
                maxSelectable={5}
                lockedSelectedIds={selectedTraineeId ? [selectedTraineeId] : []}
                typeKey={charTypeKey}
                rarityKey={charRarityKey}
                allChars={sortedAllCharsForDialogs}
              />
            </div>
          </div>

          <div className="modal-action mt-3 sticky bottom-0 bg-base-100 pt-3 border-t border-base-300 px-4 pb-[env(safe-area-inset-bottom)]">
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedChars([])}>全解除</button>
            <form method="dialog"><button className="btn">閉じる</button></form>
            <button type="button" className="btn btn-primary" onClick={() => charDialogRef.current?.close()}>決定</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* スペシャルサポートカード（UR/SSR 4枚まで） */}
      <dialog ref={supportDialogRef} className="modal">
        <div className="modal-box max-w-4xl p-4 max-h-[90vh] flex flex-col">
          <div className="mb-3">
            <h3 className="font-bold text-lg">スペシャルサポートカードを選ぶ（最大4）</h3>
            <div className="text-xs opacity-70 mt-1">現在 {selectedSupports.length} / 4</div>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 gap-3">
            <div className="rounded-lg p-3 border border-base-300 bg-base-100">
              <div className="text-xs font-medium mb-1">タイプで絞り込み</div>
              <TypeFilterBar items={supportTypeItems} value={supportTypeKey} onChange={setSupportTypeKey} />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <SupportCardPicker
                pool={filteredNormalCards}
                max={4}
                selectedIds={selectedSupports}
                onChange={(nextIds) => setSelectedSupports(nextIds.slice(0, 4))}
              />
            </div>
          </div>

          <div className="modal-action mt-3 sticky bottom-0 bg-base-100 pt-3 border-t border-base-300 px-4 pb-[env(safe-area-inset-bottom)]">
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedSupports([])}>全解除</button>
            <form method="dialog"><button className="btn">閉じる</button></form>
            <button type="button" className="btn btn-primary" onClick={() => supportDialogRef.current?.close()}>決定</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* EXサポートカード（1枚） */}
      <dialog ref={exDialogRef} className="modal">
        <div className="modal-box max-w-4xl p-4 max-h-[90vh] flex flex-col">
          <div className="mb-3">
            <h3 className="font-bold text-lg">EXサポートカードを選ぶ（1）</h3>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 gap-3">
            <div className="rounded-lg p-3 border border-base-300 bg-base-100">
              <div className="text-xs font-medium mb-1">タイプで絞り込み</div>
              <TypeFilterBar items={exTypeItems} value={exTypeKey} onChange={setExTypeKey} />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <ExSupportPicker
                pool={filteredExCards}
                selectedId={selectedExSupport || null}
                onChange={(id) => setExSupport(id)}
              />
            </div>
          </div>

          <div className="modal-action mt-3 sticky bottom-0 bg-base-100 pt-3 border-t border-base-300 px-4 pb-[env(safe-area-inset-bottom)]">
            <button type="button" className="btn btn-ghost" onClick={() => setExSupport(null)}>未選択</button>
            <form method="dialog"><button className="btn">閉じる</button></form>
            <button type="button" className="btn btn-primary" onClick={() => exDialogRef.current?.close()}>決定</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* ===== ファイル末尾の閉じタグと SP 用スタイル ===== */}
      </TwoColumnLayout>
    </>
  );
}

/* SP: CharacterSelector を確実に 5 列化。モーダル内一覧は内側だけスクロール、フッタは常に表示 */
const _trainingToolSPStyles = `
@media (max-width: 768px) {
  /* 5列化済み：グリッドのアイテム幅を強制して devtools の style (width:75px 等) を上書き */
  .char-selector-override [class*="grid"] > * ,
  .char-selector-override .char-grid > * {
    width: ${CARD_TILE_W}px !important;
    min-width: ${CARD_TILE_W}px !important;
    max-width: ${CARD_TILE_W}px !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    display: inline-block !important;
    vertical-align: top !important;
  }

  .char-selector-override [class*="grid"],
  .char-selector-override .grid,
  .char-selector-override ul[class*="grid"],
  .char-selector-override .char-grid {
    grid-template-columns: repeat(5, ${CARD_TILE_W}px) !important;
    gap: 6px !important;
    justify-items: stretch !important;
    align-items: start !important;
    grid-auto-rows: minmax(0, auto) !important;
  }

  .char-selector-override [class*="grid"] > *,
  .char-selector-override ul[class*="grid"] > * {
    box-sizing: border-box;
    padding: 4px !important;
  }
  .char-selector-override img {
    width: 100% !important;
    height: auto !important;
    object-fit: cover !important;
  }

  /* 既存の modal / typefilter 等のスタイルはそのまま */
  .type-filter-bar { display: flex !important; gap: 6px !important; flex-wrap: wrap !important; align-items: center; justify-content: flex-start; }
  .type-filter-bar button { padding: 6px 8px !important; font-size: 13px !important; border-radius: 8px !important; min-width: 0; }

  .modal-box { box-sizing: border-box; padding: 8px !important; max-height: calc(100vh - 64px) !important; display: flex; flex-direction: column; padding-bottom: calc(8px + env(safe-area-inset-bottom)) !important; }

  .modal-box > .mt-4,
  .modal-box > .mt-2 {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding-right: 6px;
    padding-bottom: calc(88px + env(safe-area-inset-bottom)) !important;
  }

  .modal-box .modal-action {
    position: sticky;
    bottom: 0;
    z-index: 1000;
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
    background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,1) 60%);
    margin-top: 8px;
  }

  .modal-box .modal-action .btn-primary { min-width: 88px; }
  .modal-box.p-6 { padding: 8px !important; padding-bottom: calc(8px + env(safe-area-inset-bottom)) !important; }
}
`;
