import React from "react";
import { useLocation } from "react-router-dom";

/**
 * React 19 の <title>/<meta>/<link> を使った軽量 SEO。
 * - どのページで呼んでも <head> にホイストされます（React 19 機能）
 * - canonical URL は VITE_SITE_ORIGIN + 現在のパスで生成
 */
export default function SEO({
  title,
  description,
  image,          // 例: https://pwc-egoist.com/ogp.png か /images/ogp.png
  noindex = false,
  canonical,      // 任意: 明示指定したいとき
}) {
  const { pathname } = useLocation();
  const origin = import.meta.env.VITE_SITE_ORIGIN || "https://pwc-egoist.com";
  const url = origin + (canonical || pathname);
  const siteName = "PWC EGOIST";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
}
