import { useMemo, useState } from "react";
import { trainingSkills } from "@/data/trainingSkills.js";
import { supportCards, isExSupportId, isSupportId, resolveSupportId } from "@/data/supportCards.js";
import { characterList } from "@/data/characterList.js";

/** 選択状態 + 発動判定をまとめた小さなフック */
export function useTrainingSkillsPipeline() {
  // 5キャラ
  const [selectedChars, setSelectedChars] = useState([]); // [id, ...] 最大5
  // サポ4
  const [selectedSupports, setSelectedSupports] = useState([]); // support id（SP-...）
  // EXサポ1
  const [selectedExSupport, setSelectedExSupport] = useState(null); // SP-EX...

  const selectChar = (id) =>
    setSelectedChars((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id].slice(0, 5);
      return next;
    });

  const removeChar = (id) => setSelectedChars((prev) => prev.filter((x) => x !== id));

  const selectSupport = (id) =>
    setSelectedSupports((prev) => {
      const resolved = resolveSupportId(id);
      if (!isSupportId(resolved)) return prev;
      if (prev.includes(resolved)) return prev;
      const next = [...prev, resolved].slice(0, 4);
      return next;
    });

  const removeSupport = (id) =>
    setSelectedSupports((prev) => prev.filter((x) => x !== resolveSupportId(id)));

  const setExSupport = (id) => {
    const resolved = id ? resolveSupportId(id) : null;
    if (!resolved || isExSupportId(resolved)) setSelectedExSupport(resolved || null);
  };

  // have を常に「解決後ID」で作る
  const haveSet = useMemo(() => {
    return new Set([
      ...selectedChars, // キャラはそのまま
      ...selectedSupports.map(resolveSupportId),
      ...(selectedExSupport ? [resolveSupportId(selectedExSupport)] : []),
    ]);
  }, [selectedChars, selectedSupports, selectedExSupport]);

  // 発動判定（targets を比較時に解決）
  const activated = useMemo(() => {
    return trainingSkills.filter((ts) =>
      ts.targets.every((t) => haveSet.has(resolveSupportId(t)))
    );
  }, [trainingSkills, haveSet]);

  // 未発動（不足要素は解決後で算出）
  const inactivated = useMemo(() => {
    return trainingSkills
      .filter((ts) => !ts.targets.every((t) => haveSet.has(resolveSupportId(t))))
      .map((ts) => {
        const missing = ts.targets
          .map(resolveSupportId)
          .filter((t) => !haveSet.has(t));
        return { ts, missing };
      });
  }, [trainingSkills, haveSet]);

  return {
    state: {
      selectedChars,
      selectedSupports,
      selectedExSupport,
    },
    actions: {
      selectChar,
      removeChar,
      selectSupport,
      removeSupport,
      setExSupport,
      setSelectedChars,
      setSelectedSupports,
    },
    derived: {
      activated,
      inactivated,
      supportCards,
      characterList,
    },
  };
}
