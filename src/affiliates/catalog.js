// src/affiliates/catalog.js
/**
 * @typedef {Object} AffItem
 * @property {string} id
 * @property {string} title
 * @property {string} url
 * @property {string} source    // "amazon" | "rakuten" | "a8" など
 * @property {string=} image
 * @property {string=} badge
 */

export const catalog /** @type {Record<string, AffItem>} */ = {
  "amz-1": {
    id: "amz-1",
    title: "【Amazon】人気のゲーミングマウス",
    url: "https://example.com/amazon/mouse",
    source: "amazon",
    image: "/images/aff/mouse.jpg",
    badge: "人気",
  },
  "amz-2": {
    id: "amz-2",
    title: "【Amazon】メカニカルキーボード",
    url: "https://example.com/amazon/keyboard",
    source: "amazon",
  },
  "rak-1": {
    id: "rak-1",
    title: "【楽天】ワイヤレスイヤホン",
    url: "https://example.com/rakuten/earbuds",
    source: "rakuten",
  },
  // …必要に応じて追加
};
