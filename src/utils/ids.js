// ID正規化は必ずここ経由に統一
export function normalizeId(raw) {
  if (raw == null) return "";
  let s = String(raw);

  // 1) Unicode正規化（NFKC）
  s = s.normalize("NFKC");

  // 2) 制御(Cc)・フォーマット(Cf)の包括除去
  s = s.replace(/[\p{Cc}\p{Cf}]/gu, "");

  // 3) よくある不可視/特殊空白を通常空白へ
  s = s
    .replace(/\u00A0/g, " ")        // NO-BREAK SPACE
    .replace(/[\u2000-\u200A]/g, " ")
    .replace(/\u202F/g, " ")
    .replace(/\u205F/g, " ")
    .replace(/\u3000/g, " ");       // 全角空白

  // 4) ハイフン系記号を U+002D に正規化
  //    U+2010..2015 (各種ハイフン/ダッシュ), U+2212 (MINUS), U+FE63, U+FF0D (全角), U+2011 (ノーブレーク)
  s = s.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE63\uFF0D]/g, "-");

  // 5) トリム＋連続空白を1つに
  s = s.trim().replace(/\s+/g, " ");

  // 6) 大文字化（IDは英数ハイフン想定／揺れ吸収）
  s = s.toUpperCase();

  return s;
}

// 比較専用の更に厳しい正規化（英数とハイフン以外を除去）
export function canonicalId(raw) {
  const n = normalizeId(raw);
  // 英数とハイフン以外を削除、連続ハイフンを1つへ
  return n.replace(/[^A-Z0-9-]/g, "").replace(/-+/g, "-");
}

/**
 * 例: "B901-03" → "B901"
 */
export function rootId(id) {
 if (id == null) return id;
 const s = String(id).trim();
 return s.split('-')[0];
}

/**
 * canonicalId を通した後に root を取る（不可視文字や全角記号を吸収した上で）
 */
export function canonicalRootId(id) {
 return rootId(canonicalId(id));
}