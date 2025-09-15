// src/components/tool/SkillCard.jsx
import React from "react";
import EffectText from "../EffectText.jsx";
import { buildImageCandidates, makeImageFallbackHandler } from "../../lib/imagePath";

export default function SkillCard({ s, getCharacterById, showIds }) {
  const targets = [s.target1, s.target2, s.target3, s.target4, s.target5].filter(Boolean);
  const activators = [s.activator1, s.activator2, s.activator3, s.activator4, s.activator5].filter(Boolean);

  const renderIcon = (rawId) => {
    const displayId = String(rawId);
    const candidates = buildImageCandidates(rawId);
    const initialSrc = candidates[0];
    const char = typeof getCharacterById === "function" ? getCharacterById(displayId) : null;
    const alt = char?.name || displayId;

    return (
      <div key={displayId} className="avatar">
        <div className="w-10 h-10 rounded-lg ring ring-base-300">
          <img
            src={initialSrc}
            data-idx="0"
            alt={alt}
            title={alt}
            onError={makeImageFallbackHandler(candidates)}
            loading="lazy"
            width="40"
            height="40"
          />
        </div>
        {showIds && (
          <span className="text-[10px] opacity-70 mt-0.5 block text-center">
            {displayId}
          </span>
        )}
      </div>
    );
  };

  return (
    <li className="card md:card-side bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition">
      {/* 左：テキスト */}
      <div className="card-body md:w-[60%]">
        <div className="flex items-start gap-1 flex-wrap">
          <h3 className="card-title text-base">{s.name}</h3>
          <div className="ms-auto flex items-center gap-2">
            <div className="badge badge-info badge-outline">対象 {targets.length}</div>
            <div className="badge badge-success badge-outline">発動 {activators.length}</div>
          </div>
        </div>
        <div className="text-sm text-base-content/80">
          <EffectText>{s.detail}</EffectText>
        </div>
      </div>

      {/* 右：画像 */}
      <figure className="p-2 md:w-[40%]">
        <div className="grid gap-1">
          <div>
            <div className="text-xs text-base-content/60 mb-1">組み合わせ</div>
            <div className="flex flex-wrap gap-1.5">
              {targets.map(renderIcon)}
            </div>
          </div>

          <div className="divider my-1" />

          <div>
            <div className="text-xs text-base-content/60 mb-1">発動者</div>
            <div className="flex flex-wrap gap-1.5">
              {activators.map(renderIcon)}
            </div>
          </div>
        </div>
      </figure>
    </li>
  );
}
