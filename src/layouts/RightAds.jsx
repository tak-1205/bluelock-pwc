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

  // ページ側から items を渡されたら優先。無ければレジストリで自動選択
  const effectiveItems =
    items && items.length ? items : getAffiliateItemsForPath(location.pathname);

  // 広告リロード用キー（ルート変化や外部イベントで更新）
  const [adKey, setAdKey] = useState(0);

  // ルートが変わったら1回リフレッシュ（AdSense）
  useEffect(() => {
    setAdKey((k) => k + 1);
  }, [location.key]);

  // 外部からの「更新して」イベント
  useEffect(() => onAdsRefresh(() => setAdKey((k) => k + 1)), []);

  const SLOT_TOP =
    import.meta.env.VITE_AD_SLOT_SIDEBAR_TOP || slots.top || "";
  const SLOT_MID =
    import.meta.env.VITE_AD_SLOT_SIDEBAR_MID || slots.mid || "";
  const SLOT_BOTTOM =
    import.meta.env.VITE_AD_SLOT_SIDEBAR_BOTTOM || slots.bottom || "";

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

  // 審査中プレースホルダ（AdSlotは描画しない）
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
      {SHOW_ADS && SLOT_TOP ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[300px]">
              <AdSlot slot={SLOT_TOP} adKey={adKey} />
            </div>
          </div>
        </div>
      ) : (
        <Placeholder minH={300} />
      )}

      {/* アフィリエイト（キュレーション） */}
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
                    className="flex items-center gap-3 hover:opacity-90 transition"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-14 h-14 rounded-lg object-cover bg-base-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-base-200" />
                    )}
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
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AdSense: 中段 */}
      {SHOW_ADS && SLOT_MID ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[250px]">
              <AdSlot slot={SLOT_MID} adKey={adKey} />
            </div>
          </div>
        </div>
      ) : (
        <Placeholder minH={250} />
      )}

      {/* AdSense: 下段 */}
      {SHOW_ADS && SLOT_BOTTOM ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <div className="min-h-[250px]">
              <AdSlot slot={SLOT_BOTTOM} adKey={adKey} />
            </div>
          </div>
        </div>
      ) : (
        <Placeholder minH={250} />
      )}
    </div>
  );
}
