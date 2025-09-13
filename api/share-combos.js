// /api/share-combos.js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const ids = url.searchParams.get('ids') || '';
  const count = url.searchParams.get('count') || '0';

  const origin = `${url.protocol}//${url.host}`;
  const toolUrl = `${origin}/tool?ids=${encodeURIComponent(ids)}`;
  const ogImage = `${origin}/api/og?ids=${encodeURIComponent(ids)}&count=${encodeURIComponent(count)}`;

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<title>PWC EGOIST | 共有</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="canonical" href="${toolUrl}" />

<!-- OGP -->
<meta property="og:type" content="article" />
<meta property="og:title" content="PWC EGOIST | 共有" />
<meta property="og:description" content="5キャラの組み合わせと発動マッチスキル数の共有" />
<meta property="og:url" content="${toolUrl}" />
<meta property="og:image" content="${ogImage}" />
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:title" content="PWC EGOIST | 共有" />
<meta property="twitter:image" content="${ogImage}" />

<meta http-equiv="refresh" content="0; url=${toolUrl}" />
</head>
<body>
<p><a href="${toolUrl}">ツールを開く</a></p>
</body>
</html>`;
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });
}
