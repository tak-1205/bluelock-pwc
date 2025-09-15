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
    title: "ブルーロック（３５） (週刊少年マガジンコミックス) Kindle版",
    url: "https://amzn.to/4m8jcbP",
    source: "amazon",
    badge: "PR",
  },
  "amz-2": {
    id: "amz-2",
    title: "ブルーロック（３４） (週刊少年マガジンコミックス) Kindle版",
    url: "https://amzn.to/4pgVwEZ",
    source: "amazon",
    badge: "PR",
  },
  "amz-3": {
    id: "amz-3",
    title: "ブルーロック－ＥＰＩＳＯＤＥ　凪－（８） (週刊少年マガジンコミックス) Kindle版",
    url: "https://amzn.to/4n1l7Ab",
    source: "amazon",
    badge: "PR",
  },
  "rak-1": {
    id: "rak-1",
    title: "[新品]ブルーロック (1-35巻 最新刊) 全巻セット",
    url: "https://item.rakuten.co.jp/mangazenkan/m1560490043/",
    source: "rakuten",
    badge: "PR",
  },
  "rak-2": {
    id: "rak-2",
    title: "ブルーロック（35）　描き下ろしカイザー・ネス・五十嵐日常着SDステッカー付き特装版 （講談社キャラクターズA） [ 金城 宗幸 ]",
    url: "https://a.r10.to/hPKk5d",
    source: "rakuten",
    image: "../images/catalog/rak-2.webp",
    badge: "PR",
  },
  "rak-3": {
    id: "rak-3",
    title: "ブルーロック（34） （講談社コミックス） [ 金城 宗幸 ]",
    url: "https://a.r10.to/hkWKqb",
    source: "rakuten",
    image: "../images/catalog/rak-3.webp",
    badge: "PR",
  },
  "rak-4": {
    id: "rak-4",
    title: "ブルーロックーEPISODE　凪ー（8） （講談社コミックス） [ 金城 宗幸 ]",
    url: "https://a.r10.to/hNME1p",
    source: "rakuten",
    image: "../images/catalog/rak-4.webp",
    badge: "PR",
  },
  "rak-5": {
    id: "rak-5",
    title: "ブルーロック　FULL　COLOR　SELECTION（2）　凪　誠士郎 （KCデラックス） [ 金城 宗幸 ]",
    url: "https://a.r10.to/h5ZRfA",
    source: "rakuten",
    image: "../images/catalog/rak-5.webp",
    badge: "PR",
  },
  "rak-6": {
    id: "rak-6",
    title: "ブルーロック　PalVerse　ブルーロック",
    url: "https://a.r10.to/hkDS9a",
    source: "rakuten",
    image: "../images/catalog/rak-6.webp",
    badge: "PR",
  },
  "rak-7": {
    id: "rak-7",
    title: "【 ブルーロック 公式ライセンス商品 】フェイスタオル 漫画 キャラクター グッズ スポーツ 綿100% KOKKA コッカ 週間少年マガジン BLUELOCK",
    url: "https://a.r10.to/h5dMKr",
    source: "rakuten",
    image: "../images/catalog/rak-7.webp",
    badge: "PR",
  },
  "rak-8": {
    id: "rak-8",
    title: "ブルーロックコレクションフィギュアリッチ ブシロードクリエイティブ 【全5種フルコンプセット＋DP台紙おまけ付き】 BLUELOCK COLLECTION FIGURE RICH グッズ フィギュア ガチャガチャ カプセルトイ【即納 在庫品】【数量限定】【フルコンプリート】",
    url: "https://a.r10.to/hPvKJ3",
    source: "rakuten",
    image: "../images/catalog/rak-8.webp",
    badge: "PR",
  },
  
};
