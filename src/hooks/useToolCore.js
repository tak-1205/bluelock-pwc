// src/hooks/useToolCore.js
//役割：データ正規化、選択状態、URL同期、共有、提案生成、広告リフレッシュ、getCharacterById

import { useEffect, useMemo, useState } from "react";
import { normalizeId, canonicalId } from "../utils/ids";
import { suggestOneOffs } from "../utils/suggestOneOffs";
import { countActivatedSkills } from "../utils/match";
import { logCombo } from "../lib/logCombo";
import useStabilizedAction from "../hooks/useStabilizedAction";
import { characterList as characterListRaw } from "../data/characterList";
import { matchSkills as matchSkillsRaw } from "../data/matchSkills";

export default function useToolCore() {
  // ===== データ正規化 =====
  const characterList = useMemo(
    () => (characterListRaw || []).map((c) => ({ ...c, id: normalizeId(c.id) })),
    []
  );
  const matchSkills = useMemo(
    () =>
      (matchSkillsRaw || []).map((s) => ({
        ...s,
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
      })),
    []
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
    try {
      return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedIds = params.get("ids");
    if (encodedIds) {
      const ids = decodeIds(encodedIds).filter(Boolean).map(normalizeId);
      const restored = characterList.filter((c) => ids.includes(c.id));
      setSelectedCharacters(restored);
    }
  }, [characterList]);

  const handleShare = () => {
    const ids = selectedCharacters.map((c) => normalizeId(c.id));
    const encoded = encodeIds(ids);
    const url = `${window.location.origin}${window.location.pathname}?ids=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("共有用URLをコピーしました！");
  };

  const { trigger: triggerCommitted } = useStabilizedAction(600);
  const handleSelectCharacters = (list) => {
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
    // data
    characterList,
    matchSkills,
    // selection
    selectedCharacters,
    setSelectedCharacters,
    selectedIds,
    selectedSet,
    selectedCanonicalSet,
    // actions
    handleSelectCharacters,
    handleApply,
    handleShare,
    // proposals/ads
    suggestions,
    suggestionsBase,
    adKey,
    // helpers
    getCharacterById,
    // flags
    SHOW_AFF,
  };
}
