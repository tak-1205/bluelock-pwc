// src/hooks/useLazyGA.js
import { useEffect } from "react";
export default function useLazyGA(measurementId) {
  useEffect(() => {
    if (!measurementId) return;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 3000));
    idle(() => {
      if (window.gtag) return;
      const s = document.createElement("script");
      s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      s.async = true;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", measurementId);
    });
  }, [measurementId]);
}
