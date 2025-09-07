// src/components/AffiliateRail.jsx

import { logAffClick } from "../lib/logAffClick";

export default function AffiliateRail({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="mt-6">
      <div className="mb-2 text-sm text-neutral-600">関連アイテム（<span className="underline">PR</span>）</div>
      <div className="flex gap-3 overflow-x-auto py-2">
        {items.map((it) => (
          <a
            key={it.id}
            href={it.href}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="min-w-56 border rounded-lg p-3 hover:bg-neutral-50"
            onClick={() => logAffClick({ id: it.id, source: it.source })}
          >
            <div className="text-sm font-medium">{it.title}</div>
            <div className="mt-1 text-xs text-neutral-500">
              {it.source === "amazon" ? "Amazon" : it.source === "rakuten" ? "楽天" : it.source}
            </div>
            <div className="mt-3 inline-flex items-center text-sm px-3 py-1 rounded-md bg-black text-white">
              商品ページへ
              <svg width="14" height="14" viewBox="0 0 24 24" className="ml-1">
                <path d="M7 17l8-8M9 7h6v6" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
