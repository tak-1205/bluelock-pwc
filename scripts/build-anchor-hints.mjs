import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SALT = process.env.HINT_SALT || "please_override_in_ci";
const COMBOS_DIR = "./public/combos";
const HINTS_DIR  = "./public/hints";
const TOP_K = Number(process.env.HINT_TOP_K || 6);           // 露出件数
const REVEAL_N = Number(process.env.HINT_REVEAL_N || 2);     // 公開する相棒人数（1〜2を推奨）
const BAND_DELTA = Number(process.env.HINT_BAND_DELTA || 2); // 発動数の幅（±2など）

const band = (score) => `${Math.max(0, score - BAND_DELTA)}-${score + BAND_DELTA}`;
const sign = (ids, score) =>
  "h:" + crypto.createHash("sha256")
               .update(ids.join(",") + "|" + score + "|" + SALT)
               .digest("hex").slice(0, 16);

const normalizeIds = (ids) => [...ids].sort(); // 必要ならプロジェクトの正規化ルールに差し替え

async function main() {
  await fs.mkdir(HINTS_DIR, { recursive: true });
  const files = (await fs.readdir(COMBOS_DIR)).filter(f => f.endsWith(".json"));

  for (const file of files) {
    const full = path.join(COMBOS_DIR, file);
    // rows: [{ ids:[5], score:number } | { ids:[5], count:number } ...]
    const rowsRaw = JSON.parse(await fs.readFile(full, "utf-8"));
    const rows = Array.isArray(rowsRaw) ? rowsRaw : [];
    if (rows.length === 0) continue;

    // “アンカー”はファイル名から推定（<anchorId>.json）
    const anchorId = path.basename(file, ".json");

    // 上位K件をヒント化（score or count のどちらでもOK）
    const top = rows.slice(0, TOP_K).map((row) => {
      const ids = Array.isArray(row.ids) ? row.ids
                : Array.isArray(row.members) ? row.members
                : [];
      if (ids.length === 0) return null;
      if (!ids.includes(anchorId)) return null; // 念のため安全側

      const sc = (typeof row.score === "number") ? row.score
               : (typeof row.count === "number") ? row.count
               : 0;

      // アンカー以外から 1〜2人を公開
      const others = ids.filter(x => x !== anchorId);
      const reveal = others.slice(0, REVEAL_N);

      return {
        anchor: anchorId,
        reveal,                       // 相棒（1〜2）
        scoreBand: band(sc),          // 発動数は幅で露出
        sig: sign(normalizeIds(ids), sc) // 改ざん検知用（逆算不可）
      };
    }).filter(Boolean);

    const out = path.join(HINTS_DIR, file); // /public/hints/<anchorId>.json
    await fs.writeFile(out, JSON.stringify(top), "utf-8");
  }
  console.log(`Hints built: ${files.length} anchors → ${HINTS_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
