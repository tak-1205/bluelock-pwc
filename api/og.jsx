import { ImageResponse } from '@vercel/og';
export const config = { runtime: 'edge' };
export default function handler() {
  return new ImageResponse(
    (<div style={{ fontSize: 64, color: '#00419b' }}>OK</div>),
    { width: 1200, height: 630 }
  );
}
