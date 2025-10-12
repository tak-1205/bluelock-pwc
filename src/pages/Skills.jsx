// src/pages/Skills.jsx
import React, { useEffect, useMemo, useState } from "react";
import TwoColumnLayout from "../layouts/TwoColumnLayout.jsx";
import SideMenu from "../layouts/SideMenu.jsx";
import RightAds from "../layouts/RightAds.jsx";
import useToolCore from "../hooks/useToolCore.js";

// ===== ユーティリティ =====
function normalize(s = "") { return String(s).replace(/\s+/g, "").toLowerCase(); }
function getString(obj, key) { const v = obj?.[key]; return v == null ? "" : String(v); }
function pickMatchSkillsFromCore(core) {
  const c = core || {};
  const candidates = [c.matchSkills, c.skills, c.data?.matchSkills, c.store?.matchSkills, c.state?.matchSkills].filter(Array.isArray);
  if (candidates.length > 0) return candidates[0];
  if (Array.isArray(window?.matchSkills)) return window.matchSkills;
  return [];
}

// ===== キー自動推定 =====
function autoPickNameKey(sampleKeys) {
  const priority = ["skillName","スキル名","スキル名称","name","技能名"];
  for (const k of priority) if (sampleKeys.has(k)) return k;
  const re = /(skill|スキル|技能)/i;
  for (const k of sampleKeys) if (re.test(k) && !/target|対象|id/i.test(k)) return k;
  return null;
}
function autoPickEffectKey(sampleKeys) {
  const priority = ["detail","effect","skillEffect","effectText","発動スキル","効果説明","効果","説明","description"];
  for (const k of priority) if (sampleKeys.has(k)) return k;
  const re = /(detail|effect|効果|発動スキル|説明)/i;
  for (const k of sampleKeys) if (re.test(k) && !/対象|target/i.test(k)) return k;
  return null;
}
function collectKeySet(arr) {
  const set = new Set();
  for (const row of Array.isArray(arr) ? arr : []) {
    if (!row || typeof row !== "object") continue;
    for (const k of Object.keys(row)) set.add(k);
  }
  return set;
}
function buildTargetKeyMaps(sampleKeys) {
  const find = (cands) => { for (const k of cands) if (sampleKeys.has(k)) return k; return null; };
  const z2 = ["０","１","２","３","４","５"];
  const nameKeys = [], idKeys = [];
  for (let i = 1; i <= 5; i++) {
    nameKeys.push(find([`発動対象${i}`, `発動対象${z2[i]}`, `target${i}`, `activator${i}`]));
    idKeys.push(find([`発動対象${i}ID`, `発動対象${z2[i]}ID`, `発動対象${i}id`, `target${i}Id`, `activator${i}Id`]));
  }
  return { nameKeys, idKeys };
}

// 効果キーワードプリセット
const KEYWORD_PRESETS = [
  "キック","テクニック","スタミナ","フィジカル","賢さ","スピード",
  "パス","ドリブル","マッチアップ","シュート成功率","突破成功率",
];

/** ========= 画像フォールバックつき 発動者ピル（以前の動作に戻す＋ID非表示） =========
 *  - 画像は ID → .png/.webp/.jpg（大小・_置換）を順に試行
 *  - IDが空でも、ラベル文字列に "B123-45" のようなIDが混ざっていれば抽出して使用
 *  - テキスト表示は「名前があるときのみ」。IDは絶対に表示しない（title等にも入れない）
 */
function MemberPill({ id, label }) {
  const labelStr = String(label || "").trim();
  const idFromLabel = useMemo(() => {
    const m = labelStr.match(/[A-Z]\d{3}-\d{2}/i);
    return m ? m[0] : "";
  }, [labelStr]);

  const rawId = String(id || "").trim();
  const base = rawId || idFromLabel;         // 以前の“表示されたとき”の挙動：ラベルからも拾う
  const baseLc = base.toLowerCase();
  const withUnderscore = base.replace(/-/g, "_");
  const exts = [".png",".webp",".jpg",".jpeg"];

  const candidates = useMemo(() => {
    const uniq = new Set();
    const push = (s) => { if (s && !uniq.has(s)) uniq.add(s); };
    if (base) {
      exts.forEach(ext => push(`/images/${base}${ext}`));
      exts.forEach(ext => push(`/images/${baseLc}${ext}`));
      exts.forEach(ext => push(`/images/${withUnderscore}${ext}`));
    }
    return Array.from(uniq);
  }, [base, baseLc, withUnderscore]);

  const [idx, setIdx] = useState(0);
  const src = idx < candidates.length ? candidates[idx] : "/images/placeholder.png";
  const onErr = () => {
    if (idx < candidates.length - 1) setIdx(idx + 1);
    else if (idx !== candidates.length) setIdx(candidates.length); // 明示的にプレースホルダーへ
  };

  const href = base ? `/character/${encodeURIComponent(base)}` : null;

  // ラベルがIDそのものなら非表示。名前だけを見せる。
  const idLike = /^[A-Z]\d{3}-\d{2}$/i.test(labelStr);
  const showName = !!labelStr && !idLike;

  const pill = (
    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-base-300 bg-base-100">
      <div className="avatar">
        <div className="w-8 h-8 rounded-full ring-1 ring-base-200 overflow-hidden">
          <img src={src} alt={showName ? labelStr : "character"} onError={onErr} />
        </div>
      </div>
      {showName && <span className="text-xs break-words">{labelStr}</span>}
    </div>
  );

  return href ? <a href={href} className="no-underline">{pill}</a> : pill;
}

export default function Skills() {
  const core = typeof useToolCore === "function" ? useToolCore() : {};

  // 1) データ取得
  const coreRaw = useMemo(() => pickMatchSkillsFromCore(core), [core]);
  const [importedRaw, setImportedRaw] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("../data/matchSkills.js").catch(() => null);
        if (!mounted || !mod) return;
        const arr = mod.matchSkills || mod.default || [];
        if (Array.isArray(arr)) setImportedRaw(arr);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // 2) キー推定
  const sampleAll = useMemo(() => ([
    ...(Array.isArray(coreRaw) ? coreRaw : []),
    ...(Array.isArray(importedRaw) ? importedRaw : []),
  ]), [coreRaw, importedRaw]);
  const keySet = useMemo(() => collectKeySet(sampleAll), [sampleAll]);
  const nameKey = useMemo(() => autoPickNameKey(keySet), [keySet]);
  const effectKey = useMemo(() => autoPickEffectKey(keySet), [keySet]);
  const { nameKeys: targetNameKeys, idKeys: targetIdKeys } = useMemo(
    () => buildTargetKeyMaps(keySet), [keySet]
  );

  // 3) グルーピング（matchSkills.js を先に処理＝プレビュー優先）
  const grouped = useMemo(() => {
    const map = new Map(); // key -> { skillName, effect, combos:[], seen:Set }
    const process = (rows, origin) => {
      for (let idx = 0; idx < rows.length; idx++) {
        const s = rows[idx];
        if (!s || typeof s !== "object") continue;
        const name = nameKey ? getString(s, nameKey).trim() : "";
        const effect = effectKey ? getString(s, effectKey) : "";
        if (!name) continue;

        const ids = targetIdKeys.map((k) => (k ? getString(s, k).trim() : "")).slice(0,5);
        const names = targetNameKeys.map((k) => (k ? getString(s, k).trim() : "")).slice(0,5);
        if (!ids.some(Boolean) && !names.some(Boolean)) continue;

        const key = `${name}||${effect}`;
        if (!map.has(key)) map.set(key, { skillName: name, effect, combos: [], seen: new Set() });

        // 重複判定：IDがあればIDで、なければ名称で
        const sigBase = ids.some(Boolean) ? ids : names;
        const signature = sigBase.filter(Boolean).join("+");
        const ent = map.get(key);
        if (ent.seen.has(signature)) continue;

        const combo = { ids, names, origin, order: idx };
        if (origin === "import") ent.combos.unshift(combo); else ent.combos.push(combo);
        ent.seen.add(signature);
      }
    };
    process(Array.isArray(importedRaw) ? importedRaw : [], "import");
    process(Array.isArray(coreRaw) ? coreRaw : [], "core");

    const arr = Array.from(map.values()).map(({ seen, ...x }) => x);
    arr.sort((a,b) => a.skillName.localeCompare(b.skillName, "ja"));
    return arr;
  }, [coreRaw, importedRaw, nameKey, effectKey, targetIdKeys, targetNameKeys]);

  // 4) 検索＆キーワードフィルタ
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [mode, setMode] = useState("AND");
  const toggle = (w) => setSelected((p) => p.includes(w) ? p.filter(x=>x!==w) : [...p, w]);
  const clearAll = () => setSelected([]);

  const filtered = useMemo(() => {
    let arr = grouped;
    if (q) {
      const n = normalize(q);
      arr = arr.filter((x) => {
        if (normalize(x.skillName).includes(n)) return true;
        if (normalize(x.effect || "").includes(n)) return true;
        for (const c of x.combos) {
          if (normalize((c.names || []).join("")).includes(n)) return true;
        }
        return false;
      });
    }
    if (selected.length > 0) {
      arr = arr.filter((x) => {
        const text = x.effect || "";
        return mode === "AND"
          ? selected.every((w) => text.includes(w))
          : selected.some((w) => text.includes(w));
      });
    }
    return arr;
  }, [grouped, q, selected, mode]);

  // === 表示（横スクロール無し・ID非表示・プレビュー1件固定） ===
  return (
    <TwoColumnLayout sidebar={<SideMenu />} right={<RightAds />}>
      <section className="p-4 space-y-5">
        <h1 className="text-xl font-bold">マッチスキル一覧</h1>

        {/* 検索 */}
        <div className="flex flex-wrap items-end gap-3">
          <label className="form-control w-full sm:w-96">
            <div className="label">
              <span className="label-text">マッチスキル名／発動スキル／発動者名で検索</span>
            </div>
            <input
              className="input input-bordered"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="例：キック、テクニック、上昇、下げる"
            />
          </label>
          <div className="ml-auto text-sm opacity-70">件数：{filtered.length}</div>
        </div>

        {/* キーワードチェックボックス */}
        <div className="rounded-box border border-base-200 p-3">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="font-semibold">効果キーワードで絞り込み</div>
            <div className="join">
              <input type="radio" name="mode" aria-label="AND" className="btn btn-xs join-item"
                     checked={mode === "AND"} onChange={() => setMode("AND")} title="すべて含む" />
              <input type="radio" name="mode" aria-label="OR" className="btn btn-xs join-item"
                     checked={mode === "OR"} onChange={() => setMode("OR")} title="どれかを含む" />
            </div>
            {selected.length > 0 && (
              <button className="btn btn-ghost btn-xs" onClick={clearAll}>クリア（{selected.length}）</button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {KEYWORD_PRESETS.map((w) => (
              <label key={w} className="label cursor-pointer justify-start gap-2">
                <input type="checkbox" className="checkbox checkbox-sm"
                       checked={selected.includes(w)} onChange={() => toggle(w)} />
                <span className="label-text text-sm">{w}</span>
              </label>
            ))}
          </div>
        </div>

        {/* テーブル（横スクロール無し） */}
        {filtered.length === 0 ? (
          <p className="text-sm opacity-70">該当スキルがありません。</p>
        ) : (
          <div>
            <table className="table table-zebra table-fixed w-full">
              <thead>
                <tr>
                  <th className="whitespace-normal">マッチスキル名</th>
                  <th className="whitespace-normal">発動スキル</th>
                  <th className="whitespace-normal">発動する組み合わせ例</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const all = row.combos || [];
                  const shown = all.slice(0, 1);
                  const remain = Math.max(0, all.length - shown.length);
                  return (
                    <tr key={`${row.skillName}-${i}`} className="align-top">
                      <td className="font-medium break-words">
                        <a href={`/skill/${encodeURIComponent(row.skillName)}`}
                           className="link link-hover">{row.skillName}</a>
                      </td>
                      <td className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                        {row.effect || "（発動スキル未設定）"}
                      </td>
                      <td className="break-words">
                        {shown.length === 0 ? (
                          <div className="text-sm opacity-70">（組み合わせ未登録）</div>
                        ) : (
                          <ul className="space-y-2">
                            {shown.map((c, idx) => (
                              <li key={idx} className="flex flex-wrap gap-2">
                                {[0,1,2,3,4].map((j) => {
                                  const hasAny = (c.ids[j] && c.ids[j].trim()) || (c.names[j] && c.names[j].trim());
                                  if (!hasAny) return null;
                                  return (
                                    <MemberPill
                                      key={j}
                                      id={(c.ids[j] || "").trim()}          // 画像/リンク用（表示はしない）
                                      label={(c.names[j] || "").trim()}     // 表示は名前のみ。IDは非表示
                                    />
                                  );
                                })}
                              </li>
                            ))}
                          </ul>
                        )}
                        {remain > 0 && (
                          <div className="mt-1 text-xs">
                            ほか {remain} 件{" "}
                            <a href={`/skill/${encodeURIComponent(row.skillName)}`} className="link link-hover">
                              詳細はこちら
                            </a>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </TwoColumnLayout>
  );
}
