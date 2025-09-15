import React, { useEffect, useRef, useState } from "react";

/** 効果テキスト：SPは3行固定＋フェード＋スクロール、PCは全文表示 */
export default function EffectText({ children }) {
  const ref = useRef(null);
  const [topShadow, setTopShadow] = useState(false);
  const [bottomShadow, setBottomShadow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // PC幅(lg>=1024px)ではスクロール制御を無効化
    const mq = typeof window !== "undefined" ? window.matchMedia("(min-width: 1024px)") : null;

    const update = () => {
      const overflow = el.scrollHeight > el.clientHeight + 1;
      setBottomShadow(overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 1);
      setTopShadow(overflow && el.scrollTop > 1);
    };

    // 初期：PCなら影を消してリスナーを付けない
    if (mq && mq.matches) {
      setTopShadow(false);
      setBottomShadow(false);
      return;
    }

    // SP/タブレットのみスクロール監視
    update();
    el.addEventListener("scroll", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);

    const onChange = () => {
      if (mq && mq.matches) {
        // 途中でPC幅になったら監視解除＆影消し
        setTopShadow(false);
        setBottomShadow(false);
        el.removeEventListener("scroll", update);
        ro.disconnect();
      }
    };
    mq?.addEventListener?.("change", onChange);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      mq?.removeEventListener?.("change", onChange);
    };
  }, [children]);

  return (
    <div className="mt-2">
      <div className="relative">
        <p
          ref={ref}
          className={[
            "mb-0 text-sm leading-5",
            // ★ SP（デフォルト）: 固定高＋スクロール
            "h-[3.75rem] overflow-y-auto pr-2 scroll-thin [scrollbar-gutter:stable]",
            // ★ PC（lg>=）: 制限解除＝全文表示
            "lg:h-auto lg:max-h-none lg:overflow-visible lg:pr-0",
          ].join(" ")}
        >
          <strong>効果:</strong> {children}
        </p>

        {/* フェードはSPのみ表示（PCは非表示） */}
        <div
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-5 lg:hidden",
            "bg-gradient-to-b from-transparent to-base-100",
            bottomShadow ? "opacity-100" : "opacity-0",
            "transition-opacity duration-150",
          ].join(" ")}
        />
        <div
          className={[
            "pointer-events-none absolute inset-x-0 top-0 h-4 lg:hidden",
            "bg-gradient-to-t from-transparent to-base-100",
            topShadow ? "opacity-100" : "opacity-0",
            "transition-opacity duration-150",
          ].join(" ")}
        />
      </div>

    </div>
  );
}
