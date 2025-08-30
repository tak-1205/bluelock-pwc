// src/components/SuggestionsBar.jsx
export default function SuggestionsBar({ items, baseScore }) {
  if (!items || !items.length) return null;

  // App.jsx と同じ方法で ?ids=... を作る（JSONをBase64）
  const encodeIds = (ids) => btoa(unescape(encodeURIComponent(JSON.stringify(ids))));

  return (
    <div className="overflow-x-auto flex gap-2 py-2">
      {items.map((it) => (
        <a
          key={it.ids.join("-")}
          href={`/?ids=${encodeIds(it.ids)}`}
          className="min-w-60 rounded-xl border p-2 hover:bg-neutral-50"
          title="この組み合わせを開く"
        >
          <div className="text-xs text-neutral-600 mb-1">1人入れ替え提案（4名一致）</div>
          <div className="text-sm">
            <span className="mr-2">- {it.remove}</span>
            <span className="mr-2">+ {it.add}</span>
            <span className="font-semibold">▲{(it.score ?? 0) - (baseScore ?? 0)}</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">発動合計: {it.score}</div>
        </a>
      ))}
    </div>
  );
}
