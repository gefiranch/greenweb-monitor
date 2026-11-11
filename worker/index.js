import html from '../public/index.html';
import favicon from '../public/favicon.svg';
import css from '../public/styles.css';
import javascript from '../public/app.js';
import { createAnalyzeHandler, securityHeaders, json } from '../src/api.js';

const analyze = createAnalyzeHandler();
const assets = new Map([
  ['/favicon.svg', [favicon, 'image/svg+xml']],
  ['/', [html, 'text/html; charset=utf-8']],
  ['/index.html', [html, 'text/html; charset=utf-8']],
  ['/styles.css', [css, 'text/css; charset=utf-8']],
  ['/app.js', [javascript, 'text/javascript; charset=utf-8']],
]);
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/analyze') return analyze(request, { apiKey: env.PAGESPEED_API_KEY ?? '', clientId: request.headers.get('CF-Connecting-IP') ?? 'unknown' });
    if (!['GET', 'HEAD'].includes(request.method)) return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } }, 405, { Allow: 'GET, HEAD' });
    const asset = assets.get(path);
    if (!asset) return json({ error: { code: 'NOT_FOUND', message: 'Page not found.' } }, 404);
    return new Response(request.method === 'HEAD' ? null : asset[0], { headers: { ...securityHeaders, 'Content-Type': asset[1], 'Cache-Control': path.endsWith('.html') || path === '/' ? 'no-cache' : 'public, max-age=3600' } });
  },
};
