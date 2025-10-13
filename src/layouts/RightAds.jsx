import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
    handler(mql);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [breakpoint]);
  return isSP;
};

export default function RightAds({ items, slots = {} }) {
  const SHOW_ADS = import.meta.env.VITE_FEATURE_ADS === "on";
  const SHOW_AFF = import.meta.env.VITE_FEATURE_AFF === "on";
  const location = useLocation();
  const NOTHING_TO_SHOW = !SHOW_ADS && !SHOW_AFF;
  if (NOTHING_TO_SHOW) return null;

  const effectiveItems =
    items && items.length ? items : getAffiliateItemsForPath(location.pathname);

  const [adKey, setAdKey] = useState(0);
  useEffect(() => { setAdKey((k) => k + 1); }, [location.key]);
  useEffect(() => onAdsRefresh(() => setAdKey((k) => k + 1)), []);

  const isSP = useIsSP(768);
  const anchorClass = isSP ? "w-[320px] min-w-[320px] h-[50px]" : "w-[300px] min-w-[300px] h-[250px]";

  const handleAffClick = (_e, item) => {
    try {
      logAffClick({ id: item.id, source: item.source, path: location.pathname, ts: Date.now() });
    } catch {}
  };

  return (
    <div className="space-y-4 overflow-visible">
      <div id="right-ads-anchor-top" className={anchorClass} />
      {SHOW_AFF && effectiveItems.length > 0 && (
        <div className="card bg-base-100 shadow overflow-visible">
          <div className="card-body overflow-visible">
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
    </div>
  );
}
