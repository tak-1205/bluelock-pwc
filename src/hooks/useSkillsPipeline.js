// src/hooks/useSkillsPipeline.js
//役割：検索・フィルタ・ソート・ページングと、そのUI状態の永続化

import { useEffect, useMemo, useState } from "react";
import { normalizeId, canonicalId } from "../utils/ids";
import { persist } from "../lib/persist";

export default function useSkillsPipeline({ matchSkills, selectedSet, selectedCanonicalSet }) {
  // UI 状態（永続化）
  const [query, setQuery] = useState(persist.get("ui.query", ""));
  const [sortKey, setSortKey] = useState(persist.get("ui.sortKey", "name-asc"));
  const [viewMode, setViewMode] = useState(persist.get("ui.viewMode", "grid"));
  const [showIds, setShowIds] = useState(persist.get("ui.showIds", false));
  const [filterTargets, setFilterTargets] = useState(persist.get("ui.filterTargets", 0));
  const [filterActivators, setFilterActivators] = useState(persist.get("ui.filterActivators", 0));
  const [pageSize, setPageSize] = useState(persist.get("ui.pageSize", 30));
  const [page, setPage] = useState(1);

  useEffect(() => persist.set("ui.query", query), [query]);
  useEffect(() => persist.set("ui.sortKey", sortKey), [sortKey]);
  useEffect(() => persist.set("ui.viewMode", viewMode), [viewMode]);
  useEffect(() => persist.set("ui.showIds", showIds), [showIds]);
  useEffect(() => persist.set("ui.filterTargets", filterTargets), [filterTargets]);
  useEffect(() => persist.set("ui.filterActivators", filterActivators), [filterActivators]);
  useEffect(() => persist.set("ui.pageSize", pageSize), [pageSize]);

  // マッチ
  const matchedSkillsRaw = useMemo(() => {
    const arr = matchSkills.filter((skill) => {
      const targets = [skill.target1, skill.target2, skill.target3, skill.target4, skill.target5]
        .filter(Boolean)
        .map(normalizeId);
      const activators = [skill.activator1, skill.activator2, skill.activator3, skill.activator4, skill.activator5]
        .filter(Boolean)
        .map(normalizeId);
      const involved = [...new Set([...targets, ...activators])];

      const isSubset = involved.length > 0 && involved.every((id) => selectedSet.has(id));
      if (isSubset) return true;

      const involvedCanonical = involved.map(canonicalId);
      return involvedCanonical.length > 0 && involvedCanonical.every((id) => selectedCanonicalSet.has(id));
    });

    // 重複排除
    const seen = new Set();
    const out = [];
    for (const s of arr) {
      const targetsKey = [s.target1, s.target2, s.target3, s.target4, s.target5]
        .filter(Boolean)
        .map(normalizeId)
        .sort()
        .join("|");
      const key = `${s.name || ""}__${s.detail || s.effect || ""}__${targetsKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
    return out;
  }, [matchSkills, selectedSet, selectedCanonicalSet]);

  // 検索
  const filteredByQuery = useMemo(() => {
    const q = query.trim();
    if (!q) return matchedSkillsRaw;
    const lower = q.toLowerCase();
    return matchedSkillsRaw.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const detail = (s.detail || s.effect || "").toLowerCase();
      return name.includes(lower) || detail.includes(lower);
    });
  }, [matchedSkillsRaw, query]);

  // クイックフィルタ
  const filteredByQuick = useMemo(() => {
    if (filterTargets === 0 && filterActivators === 0) return filteredByQuery;
    return filteredByQuery.filter((s) => {
      const t = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean).length;
      const a = [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean).length;
      const okT = filterTargets === 0 || t === filterTargets;
      const okA = filterActivators === 0 || a === filterActivators;
      return okT && okA;
    });
  }, [filteredByQuery, filterTargets, filterActivators]);

  // 並び替え
  const sortedSkills = useMemo(() => {
    const counts = (s) => ({
      t: [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean).length,
      a: [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean).length,
    });
    const arr = [...filteredByQuick];
    if (sortKey === "name-asc") {
      arr.sort((x, y) => String(x.name).localeCompare(String(y.name), "ja"));
    } else if (sortKey === "targets-desc") {
      arr.sort((x, y) => counts(y).t - counts(x).t || String(x.name).localeCompare(String(y.name), "ja"));
    } else if (sortKey === "activators-desc") {
      arr.sort((x, y) => counts(y).a - counts(x).a || String(x.name).localeCompare(String(y.name), "ja"));
    }
    return arr;
  }, [filteredByQuick, sortKey]);

  // ページング（トリガで初期化）
  useEffect(() => setPage(1), [sortKey, viewMode, query, filterTargets, filterActivators, pageSize]);
  const pagedSkills = useMemo(() => sortedSkills.slice(0, page * pageSize), [sortedSkills, page, pageSize]);

  const resultCount = sortedSkills.length;
  const canShowMore = resultCount > pagedSkills.length;

  return {
    // 状態
    query, setQuery,
    sortKey, setSortKey,
    viewMode, setViewMode,
    showIds, setShowIds,
    filterTargets, setFilterTargets,
    filterActivators, setFilterActivators,
    pageSize, setPageSize,
    page, setPage,

    // 結果
    matchedSkillsRaw,
    sortedSkills,
    pagedSkills,
    resultCount,
    canShowMore,
  };
}
