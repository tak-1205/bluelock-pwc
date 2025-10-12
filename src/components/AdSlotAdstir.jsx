import React, { useEffect, useRef } from "react";

/**
 * AdSlotAdstir
 * adstir が発行したタグ原文をそのまま差し込むタイプ。
 * script / div の順序を変えずに props.tagHtml へ渡す。
 */
export default function AdSlotAdstir({ tagHtml, lazy = true, className = "" }) {
  const hostRef = useRef(null);
  const initedRef = useRef(false);

  useEffect(() => {
    if (!hostRef.current || initedRef.current) return;

    const init = () => {
      if (!hostRef.current || initedRef.current) return;
      initedRef.current = true;
      hostRef.current.innerHTML = tagHtml;
    };

    if (!lazy) {
      init();
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          init();
          io.disconnect();
        }
      });
    }, { rootMargin: "200px" });

    io.observe(hostRef.current);
    return () => io.disconnect();
  }, [tagHtml, lazy]);

  return (
    <div className={className}>
      <div ref={hostRef} aria-label="adstir-ad" />
    </div>
  );
}
