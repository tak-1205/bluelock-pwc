// src/hooks/useToolCore.js
import { useEffect, useMemo, useState } from "react";
import { normalizeId, canonicalId } from "../utils/ids.js";   // ← ここからだけ取得（重複定義しない）
import { suggestOneOffs } from "../utils/suggestOneOffs.js";
import { countActivatedSkills } from "../utils/match.js";
import { logCombo } from "../lib/logCombo.js";
import useStabilizedAction from "../hooks/useStabilizedAction.js";
// データは初期描画後に取り込む（チャンク分離）
// import は useEffect 内で動的に行う

export default function useToolCore() {                       // ← default export
  // 共有URLから復元した直後かどうか
  const [restoredFromUrl, setRestoredFromUrl] = useState(false);

  const [raw, setRaw] = useState({ characters: [], skills: [] });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ characterList }, { matchSkills }] = await Promise.all([
        import("../data/characterList.js"),
        import("../data/matchSkills.js"),
      ]);
      if (!mounted) return;
      setRaw({ characters: characterList || [], skills: matchSkills || [] });
    })();
    return () => { mounted = false; };
  }, []);

  const characterList = useMemo(
    () => (raw.characters || []).map((c) => ({ ...c, id: normalizeId(c.id) })),
    [raw.characters]
  );

  const matchSkills = useMemo(
    () =>
      (raw.skills || []).map((s) => {
        // target1..5 → targets[] も持たせておく（下流の取り扱いを楽にする）
        const targets = [s.target1, s.target2, s.target3, s.target4, s.target5]
          .filter(Boolean)
          .map(normalizeId);

        return {
          ...s,
          targets, // ← 追加
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
        };
      }),
    [raw.skills]
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

  // ===== 選択状態 & URL 同期/共有 =====
  const [selectedCharacters, setSelectedCharacters] = useState([]);
  const encodeIds = (ids) => btoa(unescape(encodeURIComponent(JSON.stringify(ids))));
  const decodeIds = (encoded) => {
    try { return JSON.parse(decodeURIComponent(escape(atob(encoded)))); } catch { return []; }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedIds = params.get("ids");
    if (encodedIds) {
      const ids = decodeIds(encodedIds).filter(Boolean).map(normalizeId);
      const restored = characterList.filter((c) => ids.includes(c.id));
      setSelectedCharacters(restored);
      setRestoredFromUrl(true); // ← URL復元フラグON
    }
  }, [characterList]);

  // 共有URLを生成（既存handleShareのロジックを関数化）
  const buildShareUrl = (ids) => {
    const encoded = encodeIds(ids);
    return `${window.location.origin}${window.location.pathname}?ids=${encoded}`;
  };

  // 表示名のフォールバック（name → title → id）
  const displayName = (c) => {
    const raw = c?.name || c?.title || c?.id || "";
    // 「★4:」「【…】」などが含まれていれば軽く整形
    return String(raw)
      .replace(/^★\d:\s*/u, "")
      .replace(/\s*【[^】]+】/gu, "")
      .trim();
  };

  const handleShare = () => {
    const ids = selectedCharacters.map((c) => normalizeId(c.id));
    const url = buildShareUrl(ids);
    navigator.clipboard.writeText(url);
    alert("共有用URLをコピーしました！");
  };

  // ▼ 表示名：★レア表記は削除し、【バリエーション】は残す
  const displayFullName = (c) => {
    const raw = c?.name || c?.title || c?.id || "";
    return String(raw).replace(/^★\d+:\s*/u, "").trim();
  };

  // ▼ X共有：キャラ名（バリエ込み）＋ 発動マッチスキル数 ＋ 共有URL ＋ ハッシュタグ
  const handleShareX = () => {
    if (selectedIds.length !== 5) {
      alert("共有には5人のキャラ選択が必要です。");
      return;
    }
    const ids = selectedCharacters.map((c) => normalizeId(c.id));
    const encoded = encodeIds(ids);
    const skillCount = countActivatedSkills(selectedIds); // ← 先に計算
    // Xプレビュー用の共有ページURL（OG画像付き）
    const url = `${window.location.origin}/share/combos/${encoded}?count=${skillCount}`;
    const names = selectedCharacters.map(displayFullName).join(" / ");

    // 文章（できるだけ短く保つ）
    let text = `PWC EGOIST｜発動マッチスキル数: ${skillCount}件\n#ブルーロックPWC`;
    if (text.length > 260) {
      // 長すぎる場合は区切りを省略気味に（バリエーションは維持）
      const compact = selectedCharacters.map(displayFullName).join("・");
      text = `PWC EGOIST｜発動マッチスキル数: ${skillCount}件\n#ブルーロックPWC`;
    }
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  const { trigger: triggerCommitted } = useStabilizedAction(600);
  const handleSelectCharacters = (list) => {
    setRestoredFromUrl(false);  // ← 手動操作に切替
    setSelectedCharacters(list);
    const ids = list.map((c) => normalizeId(c.id));
    const encoded = encodeIds(ids);
    const url = `${window.location.origin}${window.location.pathname}?ids=${encoded}`;
    window.history.replaceState(null, "", url);
    triggerCommitted();
    setSuggestions([]);
    setSuggestionsBase(0);
  };

  const selectedIds = useMemo(() => selectedCharacters.map((c) => normalizeId(c.id)), [selectedCharacters]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCanonicalSet = useMemo(() => new Set(selectedIds.map(canonicalId)), [selectedIds]);

  // 提案 / 広告
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsBase, setSuggestionsBase] = useState(0);
  const [adKey, setAdKey] = useState(0);

  const handleApply = () => {
    if (!selectedIds.length) {
      alert("キャラを選択してください（最大5人）");
      return;
    }
    logCombo(selectedIds);
    setAdKey((k) => k + 1);

    if (selectedIds.length === 5) {
      const base = countActivatedSkills(selectedIds);
      const items = suggestOneOffs(selectedIds, 5);
      setSuggestions(items);
      setSuggestionsBase(base);
    } else {
      setSuggestions([]);
      setSuggestionsBase(0);
    }
  };

  // --- 共有URL復元後の自動提案 ---
  useEffect(() => {
    if (!restoredFromUrl) return;
    if (selectedIds.length !== 5) {
      setSuggestions([]);
      setSuggestionsBase(0);
      setRestoredFromUrl(false);
      return;
    }
    const base = countActivatedSkills(selectedIds);
    const items = suggestOneOffs(selectedIds, 5);
    setSuggestions(items);
    setSuggestionsBase(base);
    setRestoredFromUrl(false); // 一度だけ実行
  }, [restoredFromUrl, selectedIds]);

  // ID→キャラ
  const getCharacterById = (id) => {
    const n = normalizeId(id);
    const direct = charBy.byId.get(n);
    if (direct) return direct;
    const can = canonicalId(n);
    return charBy.byCanon.get(can) || null;
  };

  const SHOW_AFF = import.meta.env.VITE_FEATURE_AFF === "on";

  return {
    characterList,
    matchSkills,                 // ← ここから渡す
    selectedCharacters,
    setSelectedCharacters,
    selectedIds,
    selectedSet,
    selectedCanonicalSet,
    handleSelectCharacters,
    handleApply,
    handleShare,
    handleShareX,
    suggestions,
    suggestionsBase,
    adKey,
    getCharacterById,
    SHOW_AFF,
  };
}
