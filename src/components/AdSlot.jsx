// src/components/AdSlot.jsx
import React, { useEffect, useRef } from "react";

/** AdSense client ID（例: ca-pub-xxxxxxxxxxxxxxxx） */
const AD_CLIENT =
  import.meta.env.VITE_AD_CLIENT_ID ||
  import.meta.env.VITE_AD_CLIENT || "";

/** SDK を一度だけ注入 */
let adsScriptPromise = null;
function loadAdsScriptOnce() {
  if (adsScriptPromise) return adsScriptPromise;
  adsScriptPromise = new Promise((resolve) => {
    if (window.adsbygoogle && window.adsbygoogle.push) {
      resolve(); return;
    }
    const s = document.createElement("script");
    const q = AD_CLIENT ? `?client=${encodeURIComponent(AD_CLIENT)}` : "";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js${q}`;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
  return adsScriptPromise;
}

/** 再描画用：<ins> を作り直して push */
function recreateAndPush(insRef) {
  const oldEl = insRef.current;
  if (!oldEl || !oldEl.parentNode) return;
  const newEl = oldEl.cloneNode(false);
  insRef.current = newEl;
  oldEl.parentNode.replaceChild(newEl, oldEl);
  try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
}

export default function AdSlot({
  slot,
  adKey = 0,
  format = "auto",
  fullWidth = true,
  className = "",
  style,
}) {
  // 開発中はダミー表示（広告を読まない）
  if (import.meta.env.DEV) {
    return (
      <div
        className={`rounded-box border border-dashed p-4 text-xs ${className}`}
        style={style}
        aria-label="広告（開発中はダミー）"
      >
        AdSlot (dev) — slot: {slot || "(empty)"}
      </div>
    );
  }

  // フラグ/ID/スロット未設定なら何も描画しない
  const ADS_ENABLED = import.meta.env.VITE_FEATURE_ADS === "on";
  if (!ADS_ENABLED || !slot || !AD_CLIENT) return null;

  const wrapRef = useRef(null);
  const insRef = useRef(null);
  const hasRenderedRef = useRef(false);
  const ioRef = useRef(null);

  // 表示域に入ったら SDK を読み込み → push
  useEffect(() => {
    if (!wrapRef.current) return;
    const onIntersect = async (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      ioRef.current?.disconnect();
      await loadAdsScriptOnce();
      if (insRef.current && !hasRenderedRef.current) {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); hasRenderedRef.current = true; } catch {}
      }
    };
    const io = new IntersectionObserver(onIntersect, { rootMargin: "200px" });
    ioRef.current = io;
    io.observe(wrapRef.current);
    return () => { io.disconnect(); ioRef.current = null; };
  }, []);

  // adKey/slot が変わったら再描画
  useEffect(() => {
    if (!hasRenderedRef.current) return;
    (async () => { await loadAdsScriptOnce(); recreateAndPush(insRef); })();
  }, [adKey, slot]);

  return (
    <div ref={wrapRef} className={className} style={style}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidth ? "true" : "false"}
      />
    </div>
  );
}
