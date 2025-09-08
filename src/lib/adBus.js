// src/lib/adBus.js
export const triggerAdsRefresh = () => {
  window.dispatchEvent(new CustomEvent("ads:refresh"));
};
export const onAdsRefresh = (handler) => {
  const fn = () => handler();
  window.addEventListener("ads:refresh", fn);
  return () => window.removeEventListener("ads:refresh", fn);
};
