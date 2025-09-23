// scripts/precompute-character-combos.mjs
// /public/combos/<anchorId>.json を生成（上位30）
// ハイブリッド方式：
//  1) skills( targets+activators )から共起統計を作る
//  2) アンカーの強い相手や友達の友達までを集めた「候補プール」を構築
//  3) 上位ペアだけ厳密に「残り3人」を全列挙 → グローバルTop30 を更新
//  4) （補助）FAST 列挙も併用して取りこぼしを低減
//
// 目的：EXHAUSTIVE の天文学的計算量を回避しつつ、B002-06/08 ばかりに偏る現象を抑制

import fs from "node:fs/promises";
import path from "node:path";
import { normalizeId, canonicalId } from "../src/utils/ids.js";

// ========= 環境変数（必要なら調整） =========
const OUT_DIR = path.resolve("./public/combos");
const MAX_RESULTS = Number(process.env.MAX_RESULTS || 30);

// 候補プール構築の幅（広いほど漏れに強いが重い）
const K_PAIR       = Number(process.env.K_PAIR       || 120); // anchor とよく組む相手の上位
const K_DEGREE     = Number(process.env.K_DEGREE     || 80);  // 出現頻度の高いIDの上位
const K_FOF_PER    = Number(process.env.K_FOF_PER    || 20);  // 友達の友達 per root
const PER_ROOT_V   = Number(process.env.PER_ROOT_V   || 3);   // 同名系（nameRoot）ごとの上限

// 厳密展開する「アンカーとのペア」件数
const PAIR_EXACT_TOP = Number(process.env.PAIR_EXACT_TOP || 24);

// FAST 併用の規模（プールからそのまま4人を列挙）
const FAST_ENUM_LIMIT = Number(process.env.FAST_ENUM_LIMIT || 45000); // これを超える場合はFASTはスキップ

// ========= ローダ =========
async function tryLoadCharacterList() {
  const candidates = [
    "../src/data/characterList.js",
    "../src/data/characterList.ts",
    "../src/data/characterList.json",
  ];
  for (const rel of candidates) {
    try {
      const mod = await import(rel, { assert: rel.endsWith(".json") ? { type: "json" } : undefined });
      const list = mod?.characterList ?? mod?.default ?? null;
      if (Array.isArray(list) && list.length) return list;
    } catch {}
  }
  throw new Error("characterList dataset not found.");
}

async function tryLoadMatchSkills() {
  const candidates = [
    "../src/data/matchSkills.json",
    "../src/data/matchSkills.js",
    "../src/data/skills.json",
  ];
  for (const rel of candidates) {
    try {
      const mod = await import(rel, { assert: rel.endsWith(".json") ? { type: "json" } : undefined });
      const data = mod?.default ?? mod?.matchSkills ?? mod?.skills ?? null;
      if (Array.isArray(data) && data.length) return data;
    } catch {}
  }
  throw new Error("matchSkills dataset not found.");
}

// ========= 便利関数 =========
function nameRoot(nameLike) {
  let s = (nameLike || "").toString();
  if (s.includes("【")) s = s.split("【")[0];
  try { s = s.normalize("NFKC"); } catch {}
  s = s.replace(/\s+/g, "");
  return s.trim();
}
function extractTargets(s) {
  if (Array.isArray(s?.targets) && s.targets.length) return s.targets;
  return [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
}
function extractActivators(s) {
  if (Array.isArray(s?.activators) && s.activators.length) return s.activators;
  return [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean);
}
function uniqSorted(arr) { return Array.from(new Set(arr)).sort((a,b)=>a.localeCompare(b)); }

// ========= UI互換の採点（ツールと同じ仕様に合わせる） =========
function makeUiEquivalentCounter(matchSkills) {
  const normalized = (Array.isArray(matchSkills) ? matchSkills : []).map((s) => ({
    ...s,
    target1:    normalizeId(s.target1),
    target2:    normalizeId(s.target2),
    target3:    normalizeId(s.target3),
    target4:    normalizeId(s.target4),
    target5:    normalizeId(s.target5),
    activator1: normalizeId(s.activator1),
    activator2: normalizeId(s.activator2),
    activator3: normalizeId(s.activator3),
    activator4: normalizeId(s.activator4),
    activator5: normalizeId(s.activator5),
  }));
  return function countActivatedSkills(ids) {
    const normIds = (ids || []).map(normalizeId);
    const set = new Set(normIds);
    const canSet = new Set(normIds.map(canonicalId));
    const seen = new Set();
    let count = 0;
    for (const s of normalized) {
      const targets = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
      const activators = [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean);
      const involved = [...new Set([...targets, ...activators])];
      let ok = involved.length > 0 && involved.every((id) => set.has(id));
      if (!ok) {
        const involvedCan = involved.map(canonicalId);
        ok = involvedCan.length > 0 && involvedCan.every((id) => canSet.has(id));
      }
      if (!ok) continue;
      const targetsKey = targets.slice().sort().join("|");
      const key = `${s.name || ""}__${s.detail || s.effect || ""}__${targetsKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      count++;
    }
    return count;
  };
}

// ========= 共起統計（targets+activators を使用） =========
function buildStats(matchSkills, rosterNorm) {
  const deg = new Map();        // id -> 登場回数
  const pair = new Map();       // idA -> Map(idB -> 共起回数)
  const ensure = (m, k, v) => (m.has(k) ? m.get(k) : (m.set(k, v), v));

  for (const s of matchSkills) {
    const mem = [...extractTargets(s), ...extractActivators(s)]
      .map(normalizeId).filter(Boolean);
    const filtered = mem.filter((x) => rosterNorm.has(x));
    // degree
    for (const a of filtered) deg.set(a, (deg.get(a) || 0) + 1);
    // pair
    for (let i=0;i<filtered.length;i++) {
      const a = filtered[i];
      for (let j=i+1;j<filtered.length;j++) {
        const b = filtered[j];
        const ma = ensure(pair, a, new Map()); ma.set(b, (ma.get(b)||0)+1);
        const mb = ensure(pair, b, new Map()); mb.set(a, (mb.get(a)||0)+1);
      }
    }
  }
  return { deg, pair };
}
const topByPair = (pair, id, k) =>
  [...(pair.get(id)||new Map()).entries()].sort((a,b)=>b[1]-a[1]).slice(0,k).map(([x])=>x);
const topByDegree = (deg, k) =>
  [...deg.entries()].sort((a,b)=>b[1]-a[1]).slice(0,k).map(([x])=>x);

// ========= 候補プール構築 =========
function buildCandidatePool(anchorNorm, rosterIds, idToRoot, stats) {
  const { deg, pair } = stats;
  const laneA = topByPair(pair, anchorNorm, K_PAIR);                     // アンカーと強い相手
  const laneB = topByDegree(deg, K_DEGREE);                              // 度数が高い
  const laneCseed = laneA.slice(0, Math.max(10, Math.floor(K_PAIR/2)));
  const laneC = new Set();
  for (const seed of laneCseed) {
    for (const x of topByPair(pair, seed, K_FOF_PER)) laneC.add(x);
  }
  const unified = uniqSorted([...laneA, ...laneB, ...laneC, ...rosterIds]);
  const noAnchor = unified.filter(id => id !== anchorNorm);

  // 同名rootの露出上限（多様性確保）
  const used = new Map(); const kept = [];
  for (const id of noAnchor) {
    const r = idToRoot.get(id) || id;
    const n = used.get(r) || 0;
    if (n >= PER_ROOT_V) continue;
    kept.push(id);
    used.set(r, n+1);
  }
  return kept;
}

// ========= 厳密：上位ペアごとに 3人全列挙 =========
function exactByTopPairs(anchorNorm, pool, idToRoot, countFn, normToRawId, pairScoreMap) {
  // ペア候補をスコア順に
  const scored = pool.map(id => ({ id, s: pairScoreMap.get(id) || 0 }))
                     .sort((a,b)=>b.s-a.s)
                     .slice(0, PAIR_EXACT_TOP)
                     .map(o=>o.id);

  const results = [];
  const seen = new Set();
  const rootA = idToRoot.get(anchorNorm);

  for (const b of scored) {
    const rootB = idToRoot.get(b);
    // 残り候補（root衝突を除外、重複防止）
    const rest = pool.filter(x => x !== b && idToRoot.get(x) !== rootA && idToRoot.get(x) !== rootB);
    const n = rest.length;
    for (let i=0;i<n;i++)
      for (let j=i+1;j<n;j++)
        for (let k=j+1;k<n;k++) {
          const teamNorm = [anchorNorm, b, rest[i], rest[j], rest[k]];
          // 同名root衝突チェック（b以外でも一応）
          const roots = teamNorm.map(id => idToRoot.get(id));
          if (new Set(roots).size !== 5) continue;

          const key = teamNorm.slice().sort().join("|");
          if (seen.has(key)) continue;
          seen.add(key);

          const count = countFn(teamNorm);
          const outIds = teamNorm.map(id => normToRawId.get(id)).filter(Boolean);
          if (outIds.length !== 5) continue;
          results.push({ ids: outIds, count });
        }
  }
  results.sort((a,b)=>b.count-a.count);
  return results.slice(0, MAX_RESULTS);
}

// ========= 併用：FAST 枝刈り列挙（軽く網を広げる） =========
function fastEnumerate(anchorNorm, pool, idToRoot, countFn, normToRawId, limitComb = FAST_ENUM_LIMIT) {
  const n = pool.length;
  const approx = (n*(n-1)*(n-2)*(n-3))/24; // C(n,4)
  if (approx > limitComb) return []; // 重すぎる場合はスキップ

  const results = [];
  const seen = new Set();
  const rootA = idToRoot.get(anchorNorm);

  for (let i=0;i<n;i++)
    for (let j=i+1;j<n;j++)
      for (let k=j+1;k<n;k++)
        for (let l=k+1;l<n;l++) {
          const a=pool[i], b=pool[j], c=pool[k], d=pool[l];
          const roots=[idToRoot.get(a),idToRoot.get(b),idToRoot.get(c),idToRoot.get(d)];
          const rootSet = new Set([rootA, ...roots]);
          if (rootSet.size !== 5) continue;

          const teamNorm = [anchorNorm, a, b, c, d];
          const key = teamNorm.slice().sort().join("|");
          if (seen.has(key)) continue;
          seen.add(key);

          const count = countFn(teamNorm);
          const outIds = teamNorm.map(id => normToRawId.get(id)).filter(Boolean);
          if (outIds.length !== 5) continue;
          results.push({ ids: outIds, count });
        }
  results.sort((a,b)=>b.count-a.count);
  return results.slice(0, MAX_RESULTS);
}

// ========= main =========
async function main() {
  const list = await tryLoadCharacterList();
  const matchSkills = await tryLoadMatchSkills();
  await fs.mkdir(OUT_DIR, { recursive: true });

  const countFn = makeUiEquivalentCounter(matchSkills);

  // roster（正規化/root/生ID）
  const roster = list.map(c => ({
    idRaw: String(c.id),
    idNorm: normalizeId(c.id),
    idCanon: canonicalId(c.id),
    root: nameRoot(c.name || c.id),
  }));
  const rosterIds   = roster.map(r => r.idNorm);
  const idToRoot    = new Map(roster.map(r => [r.idNorm, r.root]));
  const normToRawId = new Map(roster.map(r => [r.idNorm, r.idRaw]));
  const rosterNormSet = new Set(rosterIds);

  // 共起統計（targets+activators）
  const stats = buildStats(matchSkills, rosterNormSet);

  // ループ（全キャラ。EXHAUSTIVE_IDS を指定したら対象のみ）
  const EX_IDS_ENV = (process.env.EXHAUSTIVE_IDS || "").trim();
  const onlySet = EX_IDS_ENV ? new Set(EX_IDS_ENV.split(",").map(s=>s.trim())) : null;

  let processed = 0;
  for (const anchor of roster) {
    const anchorId = anchor.idRaw;
    if (onlySet && !onlySet.has(anchorId) && !onlySet.has(anchor.idCanon)) continue;

    // 候補プール
    const pool = buildCandidatePool(anchor.idNorm, rosterIds, idToRoot, stats);

    // ペアの強さ（anchor と各候補の共起回数ベース）
    const pairScoreMap = new Map();
    const pairMap = stats.pair.get(anchor.idNorm) || new Map();
    for (const id of pool) pairScoreMap.set(id, pairMap.get(id) || 0);

    // 1) 上位ペア厳密
    const exactTop = exactByTopPairs(anchor.idNorm, pool, idToRoot, countFn, normToRawId, pairScoreMap);

    // 2) 併用 FAST（プール規模が許す範囲で）
    const fastTop = fastEnumerate(anchor.idNorm, pool, idToRoot, countFn, normToRawId, FAST_ENUM_LIMIT);

    // 3) マージ → Top30
    const merged = [];
    const seen = new Set();
    function pushRows(rows){
      for (const r of rows) {
        const key = r.ids.slice().sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(r);
      }
    }
    pushRows(exactTop);
    pushRows(fastTop);
    merged.sort((a,b)=>b.count-a.count);
    const top = merged.slice(0, MAX_RESULTS);

    // 書き出し
    const outFile = path.join(OUT_DIR, `${anchorId}.json`);
    await fs.writeFile(outFile, JSON.stringify(top), "utf8");
    processed++;
    console.log(`✔ ${anchorId}.json  pool=${pool.length} exactPairs=${PAIR_EXACT_TOP} → ${top.length}`);
  }

  console.log(`Done. Generated ${processed} files in ${OUT_DIR}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
