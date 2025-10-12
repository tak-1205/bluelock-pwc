// src/layouts/RightAds.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdSlot from "../components/AdSlot.jsx"; // ← AdSense 用
import AdSlotAdstir from "../components/AdSlotAdstir.jsx"; // ← adstir 用（新規）
import { logAffClick } from "../lib/logAffClick.js";
import { getAffiliateItemsForPath } from "../affiliates/registry.js";
import { onAdsRefresh } from "../lib/adBus.js";

export default function RightAds({ items, slots = {} }) {
  const SHOW_ADS = import.meta.env.VITE_FEATURE_ADS === "on";
  const SHOW_AFF = import.meta.env.VITE_FEATURE_AFF === "on";
  const AD_PROVIDER = import.meta.env.VITE_AD_PROVIDER || "adsense"; // ← 追加
  const location = useLocation();
  const NOTHING_TO_SHOW = !SHOW_ADS && !SHOW_AFF;

  if (NOTHING_TO_SHOW) return null;

  const effectiveItems =
    items && items.length ? items : getAffiliateItemsForPath(location.pathname);

  const [adKey, setAdKey] = useState(0);
  useEffect(() => { setAdKey((k) => k + 1); }, [location.key]);
  useEffect(() => onAdsRefresh(() => setAdKey((k) => k + 1)), []);

  const SLOT_TOP = import.meta.env.VITE_AD_SLOT_SIDEBAR_TOP || slots.top || "";
  const SLOT_MID = import.meta.env.VITE_AD_SLOT_SIDEBAR_MID || slots.mid || "";
  const SLOT_BOTTOM = import.meta.env.VITE_AD_SLOT_SIDEBAR_BOTTOM || slots.bottom || "";

  // adstirタグ（原文そのまま貼付）
  const TAG_TOP = import.meta.env.VITE_ADSTIR_TAG_TOP || "";
  const TAG_MID = import.meta.env.VITE_ADSTIR_TAG_MID || "";
  const TAG_BOTTOM = import.meta.env.VITE_ADSTIR_TAG_BOTTOM || "";

  const handleAffClick = (_e, item) => {
    try {
      logAffClick({
        id: item.id,
        source: item.source,
        path: location.pathname,
        ts: Date.now(),
      });
    } catch {}
  };

  const Placeholder = ({ minH = 250 }) => (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div
          className="rounded-box border border-base-300 flex items-center justify-center text-xs text-base-content/60"
          style={{ minHeight: minH }}
          aria-label="広告（審査中は非表示）"
        >
          広告（審査中は非表示）
        </div>
      </div>
    </div>
  );

  const renderAd = (pos, slot, tag, minH = 250) => {
    if (!SHOW_ADS) return null;

    if (AD_PROVIDER === "adstir" && tag) {
      return (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className={`min-h-[${minH}px]`}>
              <AdSlotAdstir tagHtml={tag} />
            </div>
          </div>
        </div>
      );
    }

    if (AD_PROVIDER === "adsense" && slot) {
      return (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className={`min-h-[${minH}px]`}>
              <AdSlot slot={slot} adKey={adKey} />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* 広告：上段 */}
      {renderAd("top", SLOT_TOP, TAG_TOP, 300)}

      {/* アフィリエイト枠 */}
      {SHOW_AFF && effectiveItems.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="text-xs font-semibold text-base-content/70">
              Sponsored
            </div>
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
                          <img
                            src={item.image}
                            alt=""
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                        </figure>
                        <div className="min-w-0">
                          <div className="text-sm font-medium line-clamp-2">
                            {item.title}
                          </div>
                          {item.badge && (
                            <div className="badge badge-ghost badge-sm mt-1">
                              {item.badge}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{item.title}</div>
                        {item.badge && (
                          <div className="badge badge-ghost badge-sm mt-1">
                            {item.badge}
                          </div>
                        )}
                      </div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 広告：中段 */}
      {renderAd("mid", SLOT_MID, TAG_MID, 250)}

      {/* 広告：下段 */}
      {renderAd("bottom", SLOT_BOTTOM, TAG_BOTTOM, 250)}
    </div>
  );
}
