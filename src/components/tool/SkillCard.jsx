// src/components/tool/SkillCard.jsx
import React from "react";
import EffectText from "../EffectText.jsx";
import { Badge } from "../UiBits";
import { normalizeId } from "../../utils/ids";

export default function SkillCard({ s, getCharacterById, showIds }) {
  const targets = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
  const activators = [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean);

  const renderIcons = (ids) => {
    const normed = ids.map(normalizeId);
    return (
      <div className="flex gap-1.5 flex-wrap">
        {normed.map((rawId) => {
          const char = getCharacterById(rawId);
          const alt = char?.name || rawId;
          const n = normalizeId(rawId);
          const c = n; // ここでは n を優先（必要に応じて canonical に変更）
          const candidates = Array.from(new Set([`/images/${c}.png`, `/images/${c.toLowerCase()}.png`]));
          const initialSrc = candidates[0];

          const handleError = (e) => {
            const el = e.currentTarget;
            const tried = el.getAttribute("data-tried")?.split("|") ?? [];
            const next = candidates.find((p) => !tried.includes(p));
            if (next) {
              tried.push(next);
              el.setAttribute("data-tried", tried.join("|"));
              el.src = next;
            } else {
              el.style.display = "none";
            }
          };

          return (
            <div key={rawId} className="flex flex-col items-center">
              <img
                src={initialSrc}
                data-tried={initialSrc}
                alt={alt}
                title={alt}
                className="w-8 h-8 rounded-md object-cover"
                onError={handleError}
              />
              {showIds && <span className="text-[10px] opacity-70 mt-0.5">{n}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <li className="border border-base-300 rounded-xl p-3 min-w-[200px] bg-base-100 shadow-sm hover:shadow transition">
      <h3 className="m-0 text-base font-semibold">{s.name}</h3>
      <div className="flex items-center gap-1.5">
        <Badge tone="blue">対象 {targets.length}</Badge>
        <Badge tone="green">発動者 {activators.length}</Badge>
      </div>

      <EffectText>{s.detail}</EffectText>

      <div className="mt-2">
        <div className="text-xs mb-1 text-base-content/70">組み合わせ</div>
        {renderIcons(targets)}
      </div>
      <div className="mt-2">
        <div className="text-xs mb-1 text-base-content/70">発動者</div>
        {renderIcons(activators)}
      </div>
    </li>
  );
}
