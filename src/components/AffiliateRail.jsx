// src/components/AffiliateRail.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { logAffClick } from "../lib/logAffClick.js";
import { getAffiliateItemsForPath } from "../affiliates/registry.js";

export default function AffiliateRail({ items }) {
  const location = useLocation();
  const fromRegistry = getAffiliateItemsForPath(location.pathname);
  const list = (items && items.length ? items : fromRegistry)
    .map((it) => ({ ...it, href: it.url ?? it.href }))
    .filter((it) => Boolean(it.href));

  if (!list.length) return null;

  return (
    <section className="mt-6">
      <div className="mb-2 text-sm text-base-content/70">
        関連アイテム <span className="badge badge-ghost badge-xs ml-1">PR</span>
      </div>

      <div className="flex gap-3 overflow-x-auto py-2 snap-x">
        {list.map((it) => (
          <a
            key={it.id}
            href={it.href}
            target="_blank"
            rel="nofollow sponsored noopener"
            onClick={() =>
              logAffClick({ id: it.id, source: it.source, path: location.pathname, ts: Date.now() })
            }
            className="card card-compact bg-base-100 shadow-sm w-56 min-w-56 shrink-0 snap-start hover:shadow transition"
            aria-label={it.title}
          >
            {/* 画像がある時だけ。幅はカードに依存、画像は枠内で収める */}
            {it.image && (
              <figure className="w-full h-28 grid place-items-center overflow-hidden p-2">
                <img
                  src={it.image}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </figure>
            )}

            <div className="card-body p-3">
              <h3 className="card-title text-sm leading-snug break-words line-clamp-2">
                {it.title}
              </h3>
              <div className="text-[11px] opacity-70">
                {it.source === "amazon" ? "Amazon" : it.source === "rakuten" ? "楽天" : it.source}
              </div>
              <div className="card-actions mt-2">
                <span className="btn btn-xs btn-primary">商品ページへ</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
