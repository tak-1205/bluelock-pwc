// /api/og.js
import { ImageResponse } from '@vercel/og';
export const config = { runtime: 'edge' };

// base64(json) → ids[]
function decodeIds(b64) {
  try {
    const norm = b64.replace(/-/g, '+').replace(/_/g, '/'); // base64url対応
    const json = decodeURIComponent(escape(atob(norm)));
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const idsB64 = url.searchParams.get('ids') || '';
  const count = Number(url.searchParams.get('count') || '0');

  const ids = decodeIds(idsB64);
  const origin = `${url.protocol}//${url.host}`;

  // 画像パス（公開配下）
  const icons = ids.map(id => `${origin}/images/${id}.png`);

  const W = 1200, H = 630;

  return new ImageResponse(
    (
      <div
        style={{
          width: W, height: H, display: 'flex', flexDirection: 'column',
          background: '#ffffff', color: '#0f172a', padding: '48px', fontSize: 36,
          fontFamily: 'sans-serif', justifyContent: 'space-between'
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 18, height: 18, background: '#00419b', clipPath: 'polygon(50% 0, 100% 38%, 81% 100%, 19% 100%, 0 38%)' }} />
          <div style={{ fontWeight: 700, color: '#00419b' }}>PWC EGOIST</div>
        </div>

        {/* アイコン列 */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {icons.map((src, i) => (
            // @vercel/og はリモート画像OK（絶対URL必須）
            <img
              key={i}
              src={src}
              width="170"
              height="170"
              style={{
                objectFit: 'contain',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 12
              }}
            />
          ))}
        </div>

        {/* フッター */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 28, color: '#334155' }}>発動マッチスキル数</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: '#00419b' }}>{Number.isFinite(count) ? count : 0}件</div>
        </div>
      </div>
    ),
    { width: W, height: H }
  );
}
