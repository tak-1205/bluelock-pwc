// scripts/build-combos.mjs
// 目的：/public/combos/<anchorId>.json（5人・発動数上位30）をプリコンピュートして保存。
// 特徴：
//  - クライアント実行ゼロ。表示はJSON読むだけ。
//  - 差分再計算対応：新規/変更スキル・新キャラに関係するアンカーのみ再計算。
//  - UIと同一ロジックで発動数をカウント（targets+activators / canonicalフォールバック / 重複排除キー）。
//  - ★同じ5人（順不同）は canonical キーで統合し、count の最大を採用＆代表rawで安定出力。
//
// 使い方：
//  - 全再計算:          ALL=1 node scripts/build-combos.mjs
//  - 特定アンカーのみ:  ANCHORS="B001-09,B002-08" node scripts/build-combos.mjs
//  - 差分のみ再計算:    DIFF=1 node scripts/build-combos.mjs
//
// 調整（環境変数）:
//  - EXPAND_HOPS=2   … プール拡張ホップ数（1〜3推奨）
//  - PER_ROOT=3      … 同名系（canonical）ごとの候補上限
//  - POOL_MAX=120    … 候補人数の最大（拡張後に制限）
//  - TOP_N=30        … 出力件数
//  - OUT_DIR=./public/combos
//  - MANIFEST=.combos-manifest.json（/public/combos 配下に書き出し）

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

// ========= 設定 =========
const OUT_DIR = path.resolve(process.env.OUT_DIR || "./public/combos");
const MANIFEST_FILE = path.join(OUT_DIR, process.env.MANIFEST || ".combos-manifest.json");
const EXPAND_HOPS = Number(process.env.EXPAND_HOPS || 2);
const PER_ROOT    = Number(process.env.PER_ROOT    || 3);
const POOL_MAX    = Number(process.env.POOL_MAX    || 120);
const TOP_N       = Number(process.env.TOP_N       || 30);
const DO_ALL      = process.env.ALL === "1";
const DO_DIFF     = process.env.DIFF === "1";
const ANCHORS_ENV = (process.env.ANCHORS || "").trim();
const ONLY_ANCHORS = ANCHORS_ENV ? new Set(ANCHORS_ENV.split(",").map(s => s.trim())) : null;

// ========= ローダ =========
async function dynImport(rel) {
  const url = pathToFileURL(path.resolve(rel)).href;
  return import(url);
}
async function loadJSON(rel) {
  const txt = await fs.readFile(path.resolve(rel), "utf8");
  return JSON.parse(txt);
}
async function tryLoadCharacterList() {
  const cand = [
    "src/data/characterList.json",
    "src/data/characterList.js",
    "src/data/characterList.ts",
  ];
  for (const p of cand) {
    try {
      if (p.endsWith(".json")) {
        const j = await loadJSON(p);
        if (Array.isArray(j) && j.length) return j;
      } else {
        const m = await dynImport(p);
        const list = m?.characterList ?? m?.default ?? null;
        if (Array.isArray(list) && list.length) return list;
      }
    } catch {}
  }
  throw new Error("characterList not found in src/data/(characterList.{json,js,ts})");
}
async function tryLoadMatchSkills() {
  const cand = [
    "src/data/matchSkills.json",
    "src/data/matchSkills.js",
  ];
  for (const p of cand) {
    try {
      if (p.endsWith(".json")) {
        const j = await loadJSON(p);
        if (Array.isArray(j) && j.length) return j;
      } else {
        const m = await dynImport(p);
        const data = m?.matchSkills ?? m?.default ?? null;
        if (Array.isArray(data) && data.length) return data;
      }
    } catch {}
  }
  throw new Error("matchSkills not found in src/data/matchSkills.{json,js}");
}
// UIと同一の正規化関数を使う（なければフォールバック）
let normalizeId, canonicalId;
async function loadIdUtils() {
  try {
    const m = await dynImport("src/utils/ids.js");
    normalizeId = m.normalizeId;
    canonicalId = m.canonicalId;
  } catch {
    // フォールバック（最低限）: 大文字/小文字・不可視・全角ハイフン等
    normalizeId = (raw) => {
      let s = String(raw || "");
      try { s = s.normalize("NFKC"); } catch {}
      s = s.replace(/[\u200B-\u200D\u2060\uFEFF\u00AD\u180E\uFE0E\uFE0F]/g, "");
      s = s.replace(/[‐-‒–—―−－]/g, "-");
      return s.trim().toLowerCase();
    };
    canonicalId = (raw) => {
      // 同名系の規則がある場合は src/utils/ids.js を使うのが望ましい
      return normalizeId(raw);
    };
  }
}

// ======== root helpers (same-person grouping) ========
function rootId(raw) {
  const s = String(raw || "");
  return s.split("-")[0];
}
// canonical(normalize(id)) を通してから root を取る
function canonicalRootId(idOrNorm) {
  const norm = normalizeId(idOrNorm);
  const can  = canonicalId(norm);
  return rootId(can);
}

// ========= スキル正規化＆採点 =========
function extractTargets(s) {
  const t = Array.isArray(s.targets) && s.targets.length
    ? s.targets
    : [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
  return t || [];
}
function extractActivators(s) {
  return [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean);
}

// UIの countActivatedSkills と同等：
//  - involved = targets ∪ activators
//  - まず normalizeId で全包含、ダメなら canonicalId で全包含
//  - 重複排除キー = `${name}__${detail||effect}__${sorted targets(norm)}`
function makeCounterFromSkills(allSkills) {
  const packed = allSkills.map((s) => {
    const targets = extractTargets(s).map(normalizeId).filter(Boolean);
    const activators = extractActivators(s).map(normalizeId).filter(Boolean);
    const involved = Array.from(new Set([...targets, ...activators]));
    const keyTargets = targets.slice().sort().join("|");
    const dupKey = `${s.name || ""}__${s.detail || s.effect || ""}__${keyTargets}`;
    return {
      involvedNorm: involved,
      involvedCan: involved.map(canonicalId),
      dupKey,
    };
  });

  return function countActivatedSkills(idsRaw) {
    const normIds = idsRaw.map(normalizeId);
    const set = new Set(normIds);
    const canSet = new Set(normIds.map(canonicalId));
    const seen = new Set();
    let count = 0;
    for (const r of packed) {
      let ok = r.involvedNorm.length > 0 && r.involvedNorm.every((x) => set.has(x));
      if (!ok) {
        ok = r.involvedCan.length > 0 && r.involvedCan.every((x) => canSet.has(x));
      }
      if (!ok) continue;
      if (seen.has(r.dupKey)) continue;
      seen.add(r.dupKey);
      count++;
    }
    return count;
  };
}

// ========= 影響アンカー抽出（差分計算） =========
function hashRow(s) {
  const t = extractTargets(s).map(normalizeId).sort();
  const a = extractActivators(s).map(normalizeId).sort();
  const payload = JSON.stringify({
    n: s.name || "",
    d: s.detail || s.effect || "",
    t, a,
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}
function allIdsInRow(s) {
  return Array.from(new Set([...extractTargets(s), ...extractActivators(s)].map(normalizeId).filter(Boolean)));
}
function buildCooccurMap(matchSkills) {
  const m = new Map(); // id -> Set(neighbors)
  const add = (id) => { if (!m.has(id)) m.set(id, new Set()); return m.get(id); };
  for (const s of matchSkills) {
    const mem = allIdsInRow(s);
    for (let i=0;i<mem.length;i++) {
      for (let j=0;j<mem.length;j++) {
        if (i===j) continue;
        add(mem[i]).add(mem[j]);
      }
    }
  }
  return m;
}
function expandHops(seedIds, co, hops) {
  let cur = new Set(seedIds);
  let acc = new Set(seedIds);
  for (let h=0; h<hops; h++) {
    const nxt = new Set();
    for (const id of cur) {
      const nb = co.get(id);
      if (!nb) continue;
      for (const x of nb) { if (!acc.has(x)) { acc.add(x); nxt.add(x); } }
    }
    cur = nxt;
    if (cur.size === 0) break;
  }
  return acc;
}

// ========= 代表raw（canonical → 表示用ID） =========
function buildRepresentativeMap(characterList) {
  const m = new Map(); // canon -> raw (先勝ち)
  for (const c of characterList || []) {
    const can = canonicalId(normalizeId(c.id));
    if (!can) continue;
    if (!m.has(can)) m.set(can, String(c.id));
  }
  return m;
}

// ========= プール構築＆列挙 =========
function buildPool(anchorRaw, cooccur, perRoot, poolMax) {
  const anchorNorm = normalizeId(anchorRaw);
  const anchorCan  = canonicalId(anchorNorm);

  // 1) アンカーからホップ拡張
  const expanded = expandHops([anchorNorm], cooccur, EXPAND_HOPS);

  // 2) 同root（ハイフン前）が過多にならないよう制限しつつ、人数上限
  const usedRoot = new Map(); const out = [];
  const anchorRoot = canonicalRootId(anchorNorm);
  for (const idNorm of expanded) {
    const root = canonicalRootId(idNorm);
    if (root === anchorRoot) continue;         // アンカーと同rootは除外
    const n = usedRoot.get(root) || 0;
    if (n >= perRoot) continue;                // PER_ROOT は root 単位
    usedRoot.set(root, n + 1);
    out.push(idNorm);
    if (out.length >= poolMax) break;
  }
  return out;
}

// ★同じ5人（順不同）は canonical キーで1件に統合（countの最大を採用）し、代表rawで安定出力
function enumerateTop5(anchorRaw, poolNorm, countFn, topN, canonToRaw) {
  const n = poolNorm.length;
  const anchorNorm = normalizeId(anchorRaw);
  const anchorCan  = canonicalId(anchorNorm);
  const repAnchor  = canonToRaw.get(anchorCan) || String(anchorRaw);

  const bestByCanonKey = new Map(); // canonKey -> { ids, count }

  for (let i=0;i<n;i++) {
    for (let j=i+1;j<n;j++) {
      for (let k=j+1;k<n;k++) {
        for (let l=k+1;l<n;l++) {
          const a = poolNorm[i], b = poolNorm[j], c = poolNorm[k], d = poolNorm[l];
          const canA = canonicalId(a);
          const canB = canonicalId(b);
          const canC = canonicalId(c);
          const canD = canonicalId(d);

          // 同root禁止（root 5種）
          const anchorRoot = canonicalRootId(anchorNorm);
          const rootSet = new Set([
            anchorRoot,
            canonicalRootId(a),
            canonicalRootId(b),
            canonicalRootId(c),
            canonicalRootId(d),
          ]);
          if (rootSet.size !== 5) continue;

          // 表示用の安定並びは従来どおり canonical 昇順の代表raw（JSON互換維持）
          const othersSorted = [canA, canB, canC, canD].sort();
          const idsStable = [repAnchor, ...othersSorted.map(cn => canonToRaw.get(cn) || cn)];

          // 採点：UIロジックと同一の countFn（normalize/canonical対応済み）
          const count = countFn(idsStable);
          if (count <= 0) continue;

          // 順不同の重複統合キー（canonical）
          const canonKey = [anchorCan, ...othersSorted].join("|");

          const prev = bestByCanonKey.get(canonKey);
          if (!prev || count > prev.count) {
            bestByCanonKey.set(canonKey, { ids: idsStable, count });
          }
        }
      }
    }
  }

  // 上位Nに整形
  const arr = [...bestByCanonKey.entries()].map(([key, v]) => ({ key, ...v }));
  arr.sort((x, y) => y.count - x.count || x.key.localeCompare(y.key));
  if (arr.length > topN) arr.length = topN;
  return arr;
}

// ========= マニフェスト =========
async function loadManifest() {
  try {
    const txt = await fs.readFile(MANIFEST_FILE, "utf8");
    return JSON.parse(txt);
  } catch {
    return { snapshot: { rowHashes: [], ids: [] }, files: {} };
  }
}
async function saveManifest(m) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(MANIFEST_FILE, JSON.stringify(m, null, 2), "utf8");
}

function computeSnapshot(matchSkills, characterList) {
  const rowHashes = matchSkills.map(hashRow).sort();
  const ids = Array.from(new Set(
    characterList.map((c)=>String(c.id)).map(normalizeId)
  )).sort();
  const hashAll = crypto.createHash("sha256")
    .update(JSON.stringify({ rowHashes, ids }))
    .digest("hex");
  return { rowHashes, ids, hashAll, generatedAt: new Date().toISOString() };
}

// ========= main =========
async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await loadIdUtils();
  const [characters, skills] = await Promise.all([tryLoadCharacterList(), tryLoadMatchSkills()]);

  const manifest = await loadManifest();
  const snap = computeSnapshot(skills, characters);

  // 対象アンカーの決定
  let targets = [];
  if (ONLY_ANCHORS) {
    targets = characters.filter(c => ONLY_ANCHORS.has(String(c.id))).map(c => String(c.id));
  } else if (DO_ALL || !manifest.snapshot?.rowHashes?.length) {
    targets = characters.map(c => String(c.id));
  } else if (DO_DIFF) {
    // 差分：スキル行のハッシュ差分から影響ID抽出 → 共起で拡張 → 影響アンカーに
    const prev = manifest.snapshot;
    const prevSet = new Set(prev.rowHashes || []);
    const curSet  = new Set(snap.rowHashes || []);
    const changedRows = new Set();
    for (const h of curSet) if (!prevSet.has(h)) changedRows.add(h);
    for (const h of prevSet) if (!curSet.has(h)) changedRows.add(h);

    // 変化のあった行に登場するID集合
    const changedIds = new Set();
    if (changedRows.size) {
      const changedHashSet = new Set(changedRows);
      for (const s of skills) {
        const h = hashRow(s);
        if (!changedHashSet.has(h)) continue;
        for (const id of allIdsInRow(s)) changedIds.add(id);
      }
    }
    // キャラの増減
    const prevIds = new Set(prev.ids || []);
    for (const id of snap.ids) if (!prevIds.has(id)) changedIds.add(id);
    for (const id of prevIds) if (!snap.ids.includes(id)) changedIds.add(id);

    // 共起で1ホップ拡張 → 影響アンカー候補
    const co = buildCooccurMap(skills);
    const impacted = expandHops(changedIds, co, 1);
    const impactedRaw = new Set();
    const allRaw = new Map(characters.map(c => [normalizeId(c.id), String(c.id)]));
    for (const id of impacted) {
      const raw = allRaw.get(id);
      if (raw) impactedRaw.add(raw);
    }
    // 新規実行がない場合は何もしない
    targets = Array.from(impactedRaw);
    if (targets.length === 0) {
      console.log("No impacted anchors detected. Nothing to do.");
      // スナップショットだけ更新
      manifest.snapshot = snap;
      await saveManifest(manifest);
      return;
    }
  } else {
    // 既定：全件（初回）と同等
    targets = characters.map(c => String(c.id));
  }

  // 採点関数（UI同等）
  const count = makeCounterFromSkills(skills);
  // 共起グラフ（プール拡張に使用）
  const cooccur = buildCooccurMap(skills);
  // 代表rawマップ（canonical -> raw）
  const repMap = buildRepresentativeMap(characters);

  let done = 0;
  for (const anchorId of targets) {
    const pool = buildPool(anchorId, cooccur, PER_ROOT, POOL_MAX);
    if (pool.length < 4) {
      // 充分な候補が無い場合は空で保存（存在しないより安全）
      await fs.writeFile(path.join(OUT_DIR, `${anchorId}.json`), JSON.stringify([], null, 0), "utf8");
      manifest.files[anchorId] = { updatedAt: new Date().toISOString(), poolSize: pool.length, top: 0 };
      console.log(`⚠ ${anchorId}: pool<4 → 0件保存`);
      continue;
    }
    const top = enumerateTop5(anchorId, pool, count, TOP_N, repMap);
    await fs.writeFile(path.join(OUT_DIR, `${anchorId}.json`), JSON.stringify(top, null, 0), "utf8");
    manifest.files[anchorId] = { updatedAt: new Date().toISOString(), poolSize: pool.length, top: top.length };
    done++;
    console.log(`✔ ${anchorId}: ${top.length} combos  (pool=${pool.length})`);
  }

  // スナップショット更新
  manifest.snapshot = snap;
  await saveManifest(manifest);
  console.log(`Done. Wrote ${done} files to ${OUT_DIR}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
