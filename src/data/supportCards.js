// src/data/supportCards.js

/**
 * スプレッドシート→JS書き出しを「1リスト」で管理する前提の定義。
 * - 入力（SOURCE_ROWS）：{ supportcard_id, supportcard_name, type }
 * - 出力（supportCards）：{ id, name, type, rarity, kind }
 *     rarity: 'UR' | 'SSR' | 'EX'       ← IDから自動判定
 *     kind:   'support' | 'ex'          ← rarity が EX のとき 'ex'、それ以外は 'support'
 *
 * 既存コード互換：
 *   import { supportCards } from "@/data/supportCards.js"
 *   supportCards.filter(s => s.kind === "support") // 通常（UR/SSR）
 *   supportCards.filter(s => s.kind === "ex")      // EX
 */

/** ===== ヘルパ（必ず1回だけ定義 & export） ===== */
export function isExSupportId(id) {
  return /^SP-EX\d{3}$/i.test(String(id || ""));
}
export function isSupportId(id) {
  // UR / SSR の通常サポート
  return /^SP-(?:UR|SSR)\d{3}$/i.test(String(id || ""));
}
export function parseRarity(id = "") {
  if (isExSupportId(id)) return "EX";
  if (/^SP-UR\d{3}$/i.test(id)) return "UR";
  if (/^SP-SSR\d{3}$/i.test(id)) return "SSR";
  // 想定外フォーマットは SSR 扱い（必要に応じて変更）
  return "SSR";
}
export function rarityToKind(rarity) {
  return rarity === "EX" ? "ex" : "support";
}

/** ===== 旧→新 ID のエイリアス（移行期間の保険） =====
 *  ゲーム側アップデートで SSR→UR に昇格したカードを、新IDへ寄せます。
 *  ※ 実際の UR 番号に合わせて必要なら編集してください。
 */
export const supportIdAliases = {
  "SP-SSR087": "SP-UR014",
  "SP-SSR038": "SP-UR013",
  "SP-SSR037": "SP-UR012",
};

/** 旧IDで渡されても、新IDに寄せる（未該当はそのまま返す） */
export function resolveSupportId(id) {
  const s = String(id || "").trim();
  return supportIdAliases[s] || s;
}

/** 1行を正規化：最小3列（id/name/type）→ 最終構造 */
function normalizeRow(row) {
  // ★ ここで旧→新IDに寄せる
  const id = resolveSupportId(String(row.supportcard_id || row.id || "").trim());
  const name = String(row.supportcard_name || row.name || "").trim();
  const type = String(row.type || "").trim();
  const type2 = String(row.type2 || "").trim();
  const rarity = parseRarity(id);
  const kind = rarityToKind(rarity);
  return { id, name, type, type2, rarity, kind };
}

/** ========== ここにスプレッドシート書き出し結果を追記 ========== */
const SOURCE_ROWS = [
{ supportcard_id: 'SP-UR017', supportcard_name: '怪物への変身',type:'スピード',type2:'賢さ'},
{ supportcard_id: 'SP-UR016', supportcard_name: '悪夢へ誘う魔王',type:'賢さ',type2:'テクニック'},
{ supportcard_id: 'SP-UR015', supportcard_name: '小悪魔の茶会',type:'キック',type2:'スピード'},
{ supportcard_id: 'SP-UR014', supportcard_name: 'Disguise！凪＆潔',type:'賢さ',type2:'テクニック'},
{ supportcard_id: 'SP-UR013', supportcard_name: 'Happy Halloween 凪＆玲王',type:'テクニック',type2:'スピード'},
{ supportcard_id: 'SP-UR012', supportcard_name: 'Happy Halloween 蜂楽＆凛',type:'賢さ',type2:'キック'},
{ supportcard_id: 'SP-UR011', supportcard_name: '熱血！肉弾！応援団！',type:'スピード',type2:'賢さ'},
{ supportcard_id: 'SP-UR010', supportcard_name: '世界に届く！',type:'テクニック',type2:'キック'},
{ supportcard_id: 'SP-UR009', supportcard_name: 'CROSS OVER',type:'フィジカル',type2:'スピード'},
{ supportcard_id: 'SP-UR008', supportcard_name: 'こいつらに支配されてる',type:'キック',type2:'フィジカル'},
{ supportcard_id: 'SP-UR007', supportcard_name: '兄弟喧嘩の途中だ！',type:'スピード',type2:'キック'},
{ supportcard_id: 'SP-UR006', supportcard_name: '夜空の理想潔＆蜂楽',type:'テクニック',type2:'賢さ'},
{ supportcard_id: 'SP-UR005', supportcard_name: '星空の願掛け七星＆凛',type:'キック',type2:'テクニック'},
{ supportcard_id: 'SP-UR004', supportcard_name: '脳天カチ割るぞ',type:'フィジカル',type2:'賢さ'},
{ supportcard_id: 'SP-UR003', supportcard_name: '選手交代',type:'スピード',type2:'フィジカル'},
{ supportcard_id: 'SP-UR002', supportcard_name: '兄ちゃんは世界一優しい',type:'テクニック',type2:'スピード'},
{ supportcard_id: 'SP-UR001', supportcard_name: 'ちゃんと見てろよ',type:'賢さ',type2:'キック'},

{ supportcard_id: 'SP-SSR113', supportcard_name: '公共の場で泳ぐな',type:'フィジカル',type2:''},

{ supportcard_id: 'SP-EX010', supportcard_name: '独裁の王',type:'フィジカル',type2:''},
{ supportcard_id: 'SP-EX009', supportcard_name: '今の俺の現在地',type:'スピード',type2:''},
{ supportcard_id: 'SP-EX008', supportcard_name: '悪魔参戦',type:'キック',type2:''},
{ supportcard_id: 'SP-EX007', supportcard_name: 'お前は一生俺に勝てないのポーズだ',type:'賢さ',type2:''},
{ supportcard_id: 'SP-EX006', supportcard_name: 'ARRIVAL STAGE',type:'テクニック',type2:''},
{ supportcard_id: 'SP-EX005', supportcard_name: '殺し屋と忍者',type:'テクニック',type2:''},
{ supportcard_id: 'SP-EX004', supportcard_name: '奪い返す',type:'賢さ',type2:'フィジカル'},
{ supportcard_id: 'SP-EX003', supportcard_name: '俺のエゴはなんだ？',type:'テクニック',type2:'スピード'},
{ supportcard_id: 'SP-EX002', supportcard_name: '死んでも嫌っすね',type:'キック',type2:'賢さ'},
{ supportcard_id: 'SP-EX001', supportcard_name: '俄然',type:'スタミナ',type2:'賢さ'},
];

/** ========== ここから下は触らない運用でOK ========== */
export const supportCards = SOURCE_ROWS.map(normalizeRow);

// 便利: 分割配列が必要な場面向け（任意）
export const normalSupportCards = supportCards.filter((c) => c.kind === "support"); // UR/SSR
export const exSupportCards     = supportCards.filter((c) => c.kind === "ex");      // EX

export default supportCards;
