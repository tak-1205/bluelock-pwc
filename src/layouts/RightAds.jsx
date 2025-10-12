// src/layouts/RightAds.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AdSlot from "../components/AdSlot.jsx"; // AdSense用（未使用なら残置OK）
import AdSlotAdstir from "../components/AdSlotAdstir.jsx"; // ← 追加済のやつ
import { logAffClick } from "../lib/logAffClick.js";
import { getAffiliateItemsForPath } from "../affiliates/registry.js";
import { onAdsRefresh } from "../lib/adBus.js";

const useIsSP = (breakpoint = 768) => {
  const [isSP, setIsSP] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setIsSP(e.matches);
    // 初期 & 監視
    handler(mql);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [breakpoint]);
  return isSP;
};

export default function RightAds({ items, slots = {} }) {
  const SHOW_ADS = import.meta.env.VITE_FEATURE_ADS === "on";
  const SHOW_AFF = import.meta.env.VITE_FEATURE_AFF === "on";
  const AD_PROVIDER = import.meta.env.VITE_AD_PROVIDER || "adstir";
  const location = useLocation();
  const NOTHING_TO_SHOW = !SHOW_ADS && !SHOW_AFF;
  if (NOTHING_TO_SHOW) return null;

  const effectiveItems =
    items && items.length ? items : getAffiliateItemsForPath(location.pathname);

  const [adKey, setAdKey] = useState(0);
  useEffect(() => { setAdKey((k) => k + 1); }, [location.key]);
  useEffect(() => onAdsRefresh(() => setAdKey((k) => k + 1)), []);

  // ── adstir：PC/SP共通タグ（位置が分かれていなければ同じものを各枠に使う）
  const TAG_PC = import.meta.env.VITE_ADSTIR_TAG_PC || "";
  const TAG_SP = import.meta.env.VITE_ADSTIR_TAG_SP || "";

  // 将来、枠別タグを使う時はここを VITE_ADSTIR_TAG_TOP_PC 等に差し替え
  const TAG_TOP_PC = TAG_PC, TAG_MID_PC = TAG_PC, TAG_BTM_PC = TAG_PC;
  const TAG_TOP_SP = TAG_SP, TAG_MID_SP = TAG_SP, TAG_BTM_SP = TAG_SP;

  const isSP = useIsSP(1024); // 例：1024px未満をSP扱い（好みで768等に変更可）

  const tagTop = isSP ? TAG_TOP_SP : TAG_TOP_PC;
  const tagMid = isSP ? TAG_MID_SP : TAG_MID_PC;
  const tagBtm = isSP ? TAG_BTM_SP : TAG_BTM_PC;

  const handleAffClick = (_e, item) => {
    try {
      logAffClick({ id: item.id, source: item.source, path: location.pathname, ts: Date.now() });
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* 上段（ファーストビューに入りやすいのでlazy=falseでもOK） */}
      {SHOW_ADS && (tagTop) && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[300px]">
              <AdSlotAdstir tagHtml={tagTop} lazy={false} />
            </div>
          </div>
        </div>
      )}

      {/* アフィリエイト枠（任意） */}
      {SHOW_AFF && effectiveItems.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="text-xs font-semibold text-base-content/70">Sponsored</div>
            <ul className="mt-2 space-y-3">
              {effectiveItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="nofollow sponsored noopener"
                    onClick={(e) => handleAffClick(e, item)}
                    className="block hover:opacity-90 transition"
                  >
                    {item.image ? (
                      <div className="grid grid-cols-[3.5rem_1fr] gap-3 items-start">
                        <figure className="w-14 h-14 grid place-items-center overflow-hidden">
                          <img src={item.image} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
                        </figure>
                        <div className="min-w-0">
                          <div className="text-sm font-medium line-clamp-2">{item.title}</div>
                          {item.badge && <div className="badge badge-ghost badge-sm mt-1">{item.badge}</div>}
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{item.title}</div>
                        {item.badge && <div className="badge badge-ghost badge-sm mt-1">{item.badge}</div>}
                      </div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 中段・下段（遅延初期化のまま） */}
      {SHOW_ADS && (tagMid) && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[250px]">
              <AdSlotAdstir tagHtml={tagMid} />
            </div>
          </div>
        </div>
      )}

      {SHOW_ADS && (tagBtm) && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[250px]">
              <AdSlotAdstir tagHtml={tagBtm} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
