// src/components/AdSlot.jsx
import React, { useEffect, useRef } from "react";

export default function AdSlot({ slot, adKey }) {
  // ← ここを追記（開発時は安全なダミーを返す）
  if (import.meta.env.DEV) {
    return (
      <div className="rounded-box border border-dashed p-4 text-xs">
        AdSlot (dev) — slot: {slot || "(empty)"}
      </div>
    );
  }

  // ↓ 本番時のレンダリング（既存の実装があればそのままでOK）
  const insRef = useRef(null);
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [adKey, slot]);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={import.meta.env.VITE_AD_CLIENT_ID} // 環境変数名はあなたの実装に合わせて
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
