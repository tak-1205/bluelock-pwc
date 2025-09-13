// src/layouts/RightAds.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AdSlot from "../components/AdSlot.jsx";
import { logAffClick } from "../lib/logAffClick.js";
import { getAffiliateItemsForPath } from "../affiliates/registry.js";
import { onAdsRefresh } from "../lib/adBus.js";

export default function RightAds({ items, slots = {} }) {
  const SHOW_ADS = import.meta.env.VITE_FEATURE_ADS === "on";
  const SHOW_AFF = import.meta.env.VITE_FEATURE_AFF === "on";
  const location = useLocation();
  const NOTHING_TO_SHOW = !SHOW_ADS && !SHOW_AFF;

  if (NOTHING_TO_SHOW) return null; // ← 右カラムまるごと非表示（TwoColumnLayoutが2カラム化）

  const effectiveItems =
    items && items.length ? items : getAffiliateItemsForPath(location.pathname);

  const [adKey, setAdKey] = useState(0);
  useEffect(() => { setAdKey((k) => k + 1); }, [location.key]);
  useEffect(() => onAdsRefresh(() => setAdKey((k) => k + 1)), []);

  const SLOT_TOP = import.meta.env.VITE_AD_SLOT_SIDEBAR_TOP || slots.top || "";
  const SLOT_MID = import.meta.env.VITE_AD_SLOT_SIDEBAR_MID || slots.mid || "";
  const SLOT_BOTTOM = import.meta.env.VITE_AD_SLOT_SIDEBAR_BOTTOM || slots.bottom || "";

  const handleAffClick = (_e, item) => {
    try {
      logAffClick({ id: item.id, source: item.source, path: location.pathname, ts: Date.now() });
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

  return (
    <div className="space-y-4">
      {/* AdSense: 上段 */}
      {SHOW_ADS && SLOT_TOP && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[300px]">
              <AdSlot slot={SLOT_TOP} adKey={adKey} />
            </div>
          </div>
        </div>
      )}

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
                      // 画像あり：左56pxのサムネ枠＋テキストの2カラムで幅安定
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
                          <div className="text-sm font-medium line-clamp-2">{item.title}</div>
                          {item.badge && (
                            <div className="badge badge-ghost badge-sm mt-1">{item.badge}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // 画像なし：左詰めのテキストのみ（余白を作らない）
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{item.title}</div>
                        {item.badge && (
                          <div className="badge badge-ghost badge-sm mt-1">{item.badge}</div>
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

      {/* AdSense: 中段 */}
      {SHOW_ADS && SLOT_MID && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[250px]">
              <AdSlot slot={SLOT_MID} adKey={adKey} />
            </div>
          </div>
        </div>
      )}

      {/* AdSense: 下段 */}
      {SHOW_ADS && SLOT_BOTTOM && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[250px]">
              <AdSlot slot={SLOT_BOTTOM} adKey={adKey} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
