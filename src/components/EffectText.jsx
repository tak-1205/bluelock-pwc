import React, { useEffect, useRef, useState } from "react";

/** 効果テキスト：3行固定＋フェード＋スクロール手がかり */
export default function EffectText({ children }) {
  const ref = useRef(null);
  const [topShadow, setTopShadow] = useState(false);
  const [bottomShadow, setBottomShadow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const overflow = el.scrollHeight > el.clientHeight + 1;
      setBottomShadow(overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 1);
      setTopShadow(overflow && el.scrollTop > 1);
    };
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [children]);

  return (
    <div className="mt-2">
      <div className="relative">
        <p
          ref={ref}
          className="mb-0 text-sm leading-5 h-[3.75rem] overflow-y-auto pr-2 scroll-thin [scrollbar-gutter:stable]"
        >
          <strong>効果:</strong> {children}
        </p>

        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-5",
            "bg-gradient-to-b from-transparent to-white",
            bottomShadow ? "opacity-100" : "opacity-0",
            "transition-opacity duration-150",
          ].join(" ")}
        />
        <div
          className={[
            "pointer-events-none absolute inset-x-0 top-0 h-4",
            "bg-gradient-to-t from-transparent to-white",
            topShadow ? "opacity-100" : "opacity-0",
            "transition-opacity duration-150",
          ].join(" ")}
        />
      </div>

      <div className="h-6 flex items-center justify-center">
        <div
          className={[
            "w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center",
            "pointer-events-none transition-opacity",
            bottomShadow ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" className="text-neutral-600">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
