// scripts/update-anchors-from-new.mjs
// 目的: 新キャラ NEW_ID の厳密出力（/public/combos/NEW_ID.json）から、
//       そのチームに含まれる既存キャラ側の Top30 を「必要なものだけ」更新する。
// 前提: /public/combos/<NEW_ID>.json が存在（precompute-character-combos.mjs を EXHAUSTIVEで実行済み）
// 使い方: NEW_ID=B001-09 node scripts/update-anchors-from-new.mjs

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB_COMBOS_DIR = path.resolve(__dirname, "../public/combos");
const MAX_RESULTS = 30;

// Utility
const sortKey = (ids) => [...ids].sort().join("|");
const uniqByKeyMaxScore = (rows) => {
  const map = new Map(); // key -> row with max score
  for (const r of rows) {
    const key = sortKey(r.ids || r.members || []);
    if (!key) continue;
    const score = typeof r.count === "number" ? r.count
                : typeof r.score === "number" ? r.score : 0;
    const cur = map.get(key);
    if (!cur || score > (cur.count ?? cur.score ?? 0)) {
      map.set(key, { ids: (r.ids || r.members || []).slice().sort(), count: score });
    }
  }
  return [...map.values()];
};

async function readJsonSafe(p) {
  try { return JSON.parse(await fs.readFile(p, "utf8")); }
  catch { return []; }
}

async function writeTop30(file, rows) {
  const dedup = uniqByKeyMaxScore(rows);
  dedup.sort((a, b) => (b.count - a.count));
  const top = dedup.slice(0, MAX_RESULTS).map(r => ({ ids: r.ids, count: r.count }));
  await fs.writeFile(file, JSON.stringify(top), "utf8");
  return top;
}

function pickImpactedAnchors(newCombos, newId) {
  const impacted = new Set();
  for (const r of newCombos) {
    const ids = r.ids || r.members || [];
    if (!ids.includes(newId)) continue;
    for (const m of ids) { if (m !== newId) impacted.add(m); }
  }
  return impacted;
}

async function main() {
  const NEW_ID = (process.env.NEW_ID || "").trim();
  if (!NEW_ID) {
    console.error("ERROR: set NEW_ID=xxxx-yy");
    process.exit(1);
  }

  // 1) 新キャラの厳密出力（および拡張ファイルがあれば）を読み込み
  const newFile = path.join(PUB_COMBOS_DIR, `${NEW_ID}.json`);
  const extraFile = path.join(PUB_COMBOS_DIR, `${NEW_ID}.extra.json`); // 任意: 拡張出力がある場合
  const newRows = await readJsonSafe(newFile);
  const extraRows = await readJsonSafe(extraFile);
  const sourceRows = uniqByKeyMaxScore([...newRows, ...extraRows]);

  if (sourceRows.length === 0) {
    console.error(`ERROR: ${newFile} が見つからないか空です。先に厳密プリコンピュートを実行してください。`);
    process.exit(1);
  }

  // 2) 影響があり得る既存キャラ（= 新キャラが含まれる編成の他メンバー）を抽出
  const impacted = pickImpactedAnchors(sourceRows, NEW_ID);
  if (impacted.size === 0) {
    console.log("No impacted anchors.");
    return;
  }

  // 3) 各既存キャラの Top30 に、新キャラを含む編成（だけ）をマージして再ソート
  let updates = 0;
  for (const anchor of impacted) {
    const anchorFile = path.join(PUB_COMBOS_DIR, `${anchor}.json`);
    const existing = await readJsonSafe(anchorFile);

    // 現在のTop30閾値（最下位スコア）
    const current = uniqByKeyMaxScore(existing).sort((a,b)=>b.count-a.count);
    const threshold = current.length >= MAX_RESULTS ? current[MAX_RESULTS - 1].count : -Infinity;

    // 新キャラを含むチームのうち、このアンカーも含むものを抽出（対称性により count は同じ）
    const candidates = [];
    for (const r of sourceRows) {
      const ids = r.ids || r.members || [];
      if (!ids.includes(NEW_ID) || !ids.includes(anchor)) continue;
      candidates.push({ ids: ids.slice().sort(), count: r.count ?? r.score ?? 0 });
    }
    if (candidates.length === 0) continue;

    // 既存とマージ → Top30 再計算
    const merged = uniqByKeyMaxScore([...current, ...candidates]).sort((a,b)=>b.count-a.count);
    const newTop30 = merged.slice(0, MAX_RESULTS);

    // 変化がある場合だけ書き出し
    const changed =
      current.length !== newTop30.length ||
      current.some((r, i) => (r.count !== newTop30[i].count) || sortKey(r.ids) !== sortKey(newTop30[i].ids));

    if (changed) {
      await writeTop30(anchorFile, newTop30);
      updates++;
      console.log(`Updated: ${path.basename(anchorFile)} (threshold ${threshold} → ${newTop30.at(-1)?.count ?? "-"})`);
    }
  }

  console.log(`Done. Impacted anchors: ${impacted.size}, Updated files: ${updates}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
