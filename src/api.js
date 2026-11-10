import { AppError } from './errors.js';
import { validateUrl } from './validation.js';
import { analyzePageSpeed } from './pagespeed.js';
import { estimateCarbon, hostingAssumption } from './carbon.js';

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
}

export function createAnalyzeHandler({ fetchImpl = fetch, carbon = estimateCarbon, now = Date.now, timeoutMs = 55000 } = {}) {
  // Ephemeral counters contain only IPs and counts, never submitted URLs or results.
  const windows = new Map();
  const active = new Set();
  let total = 0;
  let resetAt = 0;
  return async function handleAnalyze(request, { apiKey = '', clientId = 'unknown' } = {}) {
    if (request.method !== 'POST') return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST for analysis.' } }, 405, { Allow: 'POST' });
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return json({ error: { code: 'FORBIDDEN_ORIGIN', message: 'Submit analysis from this website.' } }, 403);
    if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) return json({ error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Send a JSON request.' } }, 415);
    let locked = false;
    try {
      const time = now();
      for (const [key, value] of windows) if (value.resetAt <= time) windows.delete(key);
      if (time >= resetAt) { resetAt = time + 600000; total = 0; }
      let bucket = windows.get(clientId);
      if (!bucket) {
        if (windows.size >= 1000) throw new AppError('SERVER_BUSY', 'The analyzer is busy. Please try again later.', 503);
        bucket = { count: 0, resetAt: time + 600000 };
        windows.set(clientId, bucket);
      }
      if (bucket.count >= 5 || total >= 30) throw new AppError('RATE_LIMITED', 'Too many requests. Please try again in 10 minutes.', 429);
      // Invalid requests are counted too, so malformed traffic cannot bypass the limit.
      bucket.count++; total++;
      const reader = request.body?.getReader();
      if (!reader) throw new AppError('INVALID_REQUEST', 'Send a JSON object with a URL.', 400);
      let body = '';
      let length = 0;
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.byteLength;
          if (length > 4096) { await reader.cancel(); throw new AppError('REQUEST_TOO_LARGE', 'The request is too large.', 413); }
          body += decoder.decode(value, { stream: true });
        }
        body += decoder.decode();
      } finally { reader.releaseLock(); }
      let payload;
      try { payload = JSON.parse(body); } catch { throw new AppError('INVALID_REQUEST', 'Send a valid JSON object with a URL.', 400); }
      const url = validateUrl(payload?.url);
      if (active.has(clientId)) throw new AppError('ANALYSIS_IN_PROGRESS', 'An analysis is already running. Please wait for it to finish.', 409);
      if (active.size >= 4) throw new AppError('SERVER_BUSY', 'The analyzer is busy. Please try again shortly.', 503);
      active.add(clientId); locked = true;
      const result = await analyzePageSpeed(url, { apiKey, fetchImpl, timeoutMs });
      let grams;
      try {
        grams = carbon(result.transferBytes);
        if (!Number.isFinite(grams) || grams < 0) throw new Error();
      } catch { throw new AppError('CARBON_CALCULATION_FAILED', 'The carbon estimate could not be calculated. Please try again.', 502); }
      return json({ ...result, estimatedCO2eGrams: grams, carbonModel: 'SWDM v4', hostingAssumption });
    } catch (error) {
      const safe = error instanceof AppError ? error : new AppError('INTERNAL_ERROR', 'The analysis could not be completed. Please try again.');
      return json({ error: { code: safe.code, message: safe.message } }, safe.status, safe.status === 429 ? { 'Retry-After': '600' } : {});
    } finally { if (locked) active.delete(clientId); }
  };
}
