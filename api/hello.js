// api/hello.js
export const config = { runtime: 'edge' };
export default () => new Response('ok', { headers: { 'content-type': 'text/plain' } });

