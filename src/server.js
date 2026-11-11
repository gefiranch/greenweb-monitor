import express from 'express';
import { fileURLToPath } from 'node:url';
import { createAnalyzeHandler, securityHeaders } from './api.js';

export function createApp(options = {}) {
  const app = express();
  const analyze = createAnalyzeHandler(options);
  app.disable('x-powered-by');
  // Do not trust arbitrary X-Forwarded-For headers on the standalone server.
  app.use((req, res, next) => { res.set(securityHeaders); next(); });
  app.all('/api/analyze', express.text({ type: () => true, limit: '4kb' }), async (req, res) => {
    const request = new Request('http://greenweb.local/api/analyze', {
      method: req.method,
      headers: { 'content-type': req.get('content-type') ?? '', ...(req.get('origin') ? { origin: req.get('origin') } : {}) },
      ...(!['GET', 'HEAD'].includes(req.method) ? { body: req.body ?? '' } : {}),
    });
    // Compare browser origin against the actual direct connection host separately.
    try {
      const origin = new URL(req.get('origin'));
      if (['http:', 'https:'].includes(origin.protocol) && origin.host === req.get('host')) request.headers.set('origin', 'http://greenweb.local');
    } catch { /* Missing or invalid origins are handled by the shared API. */ }
    const response = await analyze(request, { apiKey: process.env.PAGESPEED_API_KEY ?? '', clientId: req.socket.remoteAddress ?? 'unknown' });
    for (const [key, value] of response.headers) res.setHeader(key, value);
    res.status(response.status).send(await response.text());
  });
  const publicDirectory = fileURLToPath(new URL('../public', import.meta.url));
  // Vercel serves public assets through its CDN and bypasses express.static.
  // Keep the document route explicit for requests dispatched to the function.
  app.get(['/', '/index.html'], (req, res) => res.sendFile('index.html', { root: publicDirectory }));
  app.use(express.static(publicDirectory, { etag: true, maxAge: 0 }));
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found.' } }));
  app.use((error, req, res, next) => {
    const status = error.type === 'entity.too.large' ? 413 : 400;
    res.status(status).json({ error: { code: status === 413 ? 'REQUEST_TOO_LARGE' : 'INVALID_REQUEST', message: status === 413 ? 'The request is too large.' : 'The request could not be read.' } });
  });
  return app;
}

// Vercel imports the recognized entry module instead of running the CLI guard.
const app = createApp();
export default app;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const port = Number(args[args.indexOf('--port') + 1]) || Number(process.env.PORT) || 3000;
  const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '0.0.0.0';
  app.listen(port, host, () => console.info(`GreenWeb Monitor is running on port ${port}`));
}
