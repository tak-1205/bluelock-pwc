import { normalizeId, canonicalId } from "../utils/ids";

/** 不可視・制御・記号などを除去し、英数字とハイフンのみ残す */
export function sanitizeToken(s) {
  return String(s || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")                    // 制御
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\uFE00-\uFE0F\uFEFF]/g, "") // 各種不可視
    .replace(/\u00A0/g, "")                                   // NBSP
    .replace(/[^A-Za-z0-9-]/g, "");                           // ホワイトリスト
}

/** 画像候補を優先順で返す（重複除去済み） */
export function buildImageCandidates(rawId) {
  const raw = sanitizeToken(rawId);
  const norm = sanitizeToken(normalizeId(raw));
  const canon = sanitizeToken(canonicalId(norm));

  const bases = Array.from(
    new Set([
      norm, canon,
      norm.toLowerCase(), canon.toLowerCase(),
      norm.toUpperCase(), canon.toUpperCase(),
    ])
  ).filter(Boolean);

  return bases.map((b) => `/images/${b}.png`);
}

/** onError で次の候補へ切替えるハンドラを作成 */
export function makeImageFallbackHandler(candidates) {
  return (e) => {
    const el = e.currentTarget;
    const idx = Number(el.getAttribute("data-idx") || "0");
    const nextIdx = idx + 1;
    if (nextIdx < candidates.length) {
      el.setAttribute("data-idx", String(nextIdx));
      el.src = candidates[nextIdx];
    } else {
      el.style.display = "none";
    }
  };
}
