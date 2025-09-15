// src/components/SuggestionsBar.jsx
import { buildImageCandidates, makeImageFallbackHandler } from "../lib/imagePath";
import { Link } from "react-router-dom";


export default function SuggestionsBar({ items, baseScore }) {
  if (!items || !items.length) return null;

  // App.jsx と同じ方法で ?ids=... を作る（JSONをBase64）
  const encodeIds = (ids) => btoa(unescape(encodeURIComponent(JSON.stringify(ids))));

  // 画像フォールバック: /images/{id}.png → /images/{id.toLowerCase()}.png → 最後は非表示
  const renderAvatar = (id, type /* 'remove' | 'add' */) => {
    const idStr = String(id || "");
    const candidates = buildImageCandidates(id);
    const initialSrc = candidates[0];

    const handleError = (e) => {
      const el = e.currentTarget;
      const tried = (el.getAttribute("data-tried") || "").split("|").filter(Boolean);
      const next = candidates.find((p) => !tried.includes(p));
      if (next) {
        el.setAttribute("data-tried", [...tried, next].join("|"));
        el.src = next;
      } else {
        el.style.display = "none"; // 画像が無ければ最後は非表示
      }
    };

    const badgeClass = type === "remove" ? "badge-error" : "badge-success";
    const symbol = type === "remove" ? "−" : "+";

    return (
      <div className="indicator">
        <span className={`indicator-item badge ${badgeClass} badge-sm`}>{symbol}</span>
        <div className="avatar">
          <div className="w-10 h-10 rounded-lg ring ring-base-300">
            <img
              src={initialSrc}
              data-idx="0"
              alt={idStr}
              title={idStr}
              onError={makeImageFallbackHandler(candidates)}
              loading="lazy"
              width="40"
              height="40"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto flex gap-2 py-2">
      {items.map((it) => {
        const delta = (it.score ?? 0) - (baseScore ?? 0);
        const deltaSign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
        const deltaClass = delta > 0 ? "text-success" : delta < 0 ? "text-error" : "text-base-content/60";

        return (
          <Link
            key={it.ids.join("-")}
            to={`/tool?ids=${encodeIds(it.ids)}`}
            className="min-w-60 rounded-xl border p-3 hover:bg-base-100 transition"
            title="この組み合わせを開く"
          >
            <div className="text-[14px] text-base-content/60 mb-2">入れ替え後の発動数: <span className="text-sm font-semibold">{it.score}</span></div>

            {/* 画像で -remove → +add を表示 */}
            <div className="flex items-center gap-3">
              {renderAvatar(it.remove, "remove")}
              <span className="text-base-content/50">→</span>
              {renderAvatar(it.add, "add")}
              <span className={`ml-auto text-[16px] font-semibold ${deltaClass}`}>
                {deltaSign}{Math.abs(delta)}
              </span>
            </div>

          </Link>
        );
      })}
    </div>
  );
}
