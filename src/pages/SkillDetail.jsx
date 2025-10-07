import React, { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";
import useToolCore from "../hooks/useToolCore.js";
import { canonicalId } from "../utils/ids.js";

function onImgFallback(e) {
  if (!e.currentTarget.dataset.fallen) {
    e.currentTarget.dataset.fallen = "1";
    e.currentTarget.src = "/images/no-image.png";
  }
}

// スキル1レコードから「発動対象のバージョンID配列」を抜き出す（順不同）
function extractTargetsIds(s) {
  // すでに配列であればそれを採用
  if (Array.isArray(s?.targetsIds)) return s.targetsIds.map((x) => canonicalId(String(x)));

  // 'targets' が配列ならそれを採用
  if (Array.isArray(s?.targets)) return s.targets.map((x) => canonicalId(String(x)));

  // 列形式（target1Id〜target5Id / 発動対象1ID〜）を広めに吸収
  const keys = [
    "target1Id","target2Id","target3Id","target4Id","target5Id",
    "発動対象1ID","発動対象2ID","発動対象3ID","発動対象4ID","発動対象5ID",
  ];
  const ids = [];
  for (const k of keys) {
    const v = s?.[k];
    if (v) ids.push(canonicalId(String(v)));
  }
  return ids;
}

export default function SkillDetail() {
  const core = (typeof useToolCore === "function") ? useToolCore() : {};
  const all = Array.isArray(core.matchSkills) ? core.matchSkills : [];

  const { pathname } = useLocation();
  const skillName = decodeURIComponent(pathname.split("/").pop() || "");

  // 対象スキル名のレコードを抽出
  const records = useMemo(() => {
    if (!skillName) return [];
    return all.filter((s) => (s?.skillName || "").trim() === skillName);
  }, [all, skillName]);

  // 「発動スキル（説明）」ごとに分け、その中で"組み合わせ"（順不同のID集合）をユニーク化
  const groups = useMemo(() => {
    const byEffect = new Map();
    for (const s of records) {
      const effect =
        s?.effect ??
        s?.skillEffect ??
        s?.description ??
        s?.発動スキル ??
        "";

      const targets = extractTargetsIds(s).filter(Boolean);
      if (targets.length === 0) continue;

      // 順不同の組み合わせキー（ソート→結合）
      const combo = [...targets].sort((a, b) => a.localeCompare(b)).join("|");

      if (!byEffect.has(effect)) byEffect.set(effect, new Map());
      const set = byEffect.get(effect);
      if (!set.has(combo)) set.set(combo, targets); // 表示用には配列で保持
    }

    // Map(effect -> Map(comboKey -> ids[])) を配列化・ソート
    return Array.from(byEffect.entries()).map(([effect, m]) => {
      const combos = Array.from(m.values()).sort((a, b) =>
        a.join().localeCompare(b.join())
      );
      return { effect, combos };
    });
  }, [records]);

  useEffect(() => {
    document.title = skillName
      ? `${skillName}｜スキル詳細｜PWC EGOIST`
      : `スキル詳細｜PWC EGOIST`;
  }, [skillName]);

  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="p-4 space-y-4">
        <div className="breadcrumbs text-sm">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/skills">スキル一覧</a></li>
            <li>{skillName || "スキル"}</li>
          </ul>
        </div>

        <h1 className="text-xl font-bold">{skillName || "スキル"}</h1>

        {records.length === 0 && (
          <p className="opacity-70">該当スキルのデータが見つかりませんでした。</p>
        )}

        {groups.map(({ effect, combos }, gi) => (
          <div key={gi} className="space-y-3">
            <div className="prose max-w-none">
              <h2 className="text-lg font-semibold">発動スキル</h2>
              <p className="mt-1">{effect || "（説明未設定）"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {combos.map((ids, ci) => (
                <div key={ci} className="card bg-base-100 shadow">
                  <div className="card-body gap-3">
                    <div className="flex -space-x-2 overflow-hidden">
                      {ids.map((vid, i) => (
                        <img
                          key={i}
                          src={`/images/${vid}.png`}
                          onError={onImgFallback}
                          alt={vid}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full ring-2 ring-base-100 object-cover"
                          title={vid}
                        />
                      ))}
                    </div>
                    <div className="text-sm">{ids.join(" / ")}</div>
                  </div>
                </div>
              ))}
            </div>

            {combos.length === 0 && (
              <div className="text-sm opacity-70">この発動スキルに対応する組み合わせは見つかりませんでした。</div>
            )}
          </div>
        ))}
      </section>
    </TwoColumnLayout>
  );
}
