import { useEffect } from "react";

export default function AdSlot({ slot, adKey }) {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, [adKey]);

  return (
    <ins className="adsbygoogle"
      style={{ display: "block", minHeight: 120 }}
      data-ad-client="ca-pub-XXXXXXXXXXXXXXX"  // ← あなたのID
      data-ad-slot={slot}                      // ← 作成したユニットのslot
      data-ad-format="auto"
      data-full-width-responsive="true" />
  );
}
