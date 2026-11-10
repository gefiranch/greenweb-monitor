import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAnalyzeHandler } from '../src/api.js';
import { createApp } from '../src/server.js';
import { pageSpeedFixture } from './fixture.js';

const request = (url = 'https://example.com/') => new Request('https://greenweb.example/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
const success = async () => Response.json(pageSpeedFixture());
test('API returns integrated real CO2 result for a test PageSpeed fixture and supports reanalysis', async () => {
  const handler = createAnalyzeHandler({ fetchImpl: success });
  for (let i = 0; i < 2; i++) {
    const response = await handler(request());
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.estimatedCO2eGrams, 0.1482);
    assert.equal(data.carbonModel, 'SWDM v4');
    assert.ok(data.hostingAssumption.includes('not been verified'));
    assert.ok(!JSON.stringify(data).includes('lighthouseResult'));
  }
});
test('invalid URLs do not call upstream', async () => {
  let calls = 0; const handler = createAnalyzeHandler({ fetchImpl: async () => { calls++; return success(); } });
  assert.equal((await handler(request('http://127.0.0.1'))).status, 400);
  assert.equal(calls, 0);
});
test('API rejects unsupported methods and content types', async () => {
  const handler = createAnalyzeHandler();
  assert.equal((await handler(new Request('https://greenweb.example/api/analyze'))).status, 405);
  assert.equal((await handler(new Request('https://greenweb.example/api/analyze', { method: 'POST', body: '{}' }))).status, 415);
});
test('API rejects cross-origin submission', async () => {
  const req = request(); req.headers.set('Origin', 'https://attacker.example');
  assert.equal((await createAnalyzeHandler()(req)).status, 403);
});
test('API rejects malformed and oversized JSON', async () => {
  for (const [body, expected] of [['{bad', 400], ['x'.repeat(4097), 413]]) {
    const req = new Request('https://greenweb.example/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal((await createAnalyzeHandler()(req)).status, expected);
  }
});
test('rate limiting rejects sixth attempt and resets without storing URLs', async () => {
  let now = 0;
  const handler = createAnalyzeHandler({ fetchImpl: success, now: () => now });
  for (let i = 0; i < 5; i++) assert.equal((await handler(request())).status, 200);
  const response = await handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '600');
  now = 600001;
  assert.equal((await handler(request())).status, 200);
});
test('prevents duplicate in-flight requests and releases lock afterward', async () => {
  let finish;
  const handler = createAnalyzeHandler({ fetchImpl: () => new Promise(resolve => { finish = () => resolve(Response.json(pageSpeedFixture())); }) });
  const pending = handler(request());
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal((await handler(request())).status, 409);
  finish(); assert.equal((await pending).status, 200);
});
test('calculation failure does not return fabricated results', async () => {
  const handler = createAnalyzeHandler({ fetchImpl: success, carbon: () => NaN });
  const response = await handler(request()); const data = await response.json();
  assert.equal(response.status, 502); assert.equal(data.error.code, 'CARBON_CALCULATION_FAILED');
  assert.equal(data.estimatedCO2eGrams, undefined);
});
test('API recovers after upstream failure', async () => {
  let calls = 0;
  const handler = createAnalyzeHandler({ fetchImpl: async () => ++calls === 1 ? Response.json({}, { status: 429 }) : success() });
  assert.equal((await handler(request())).status, 503);
  assert.equal((await handler(request())).status, 200);
});
test('Node/Express serves the frontend and connected API over HTTP', async t => {
  const server = createApp({ fetchImpl: success }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.ok(!page.headers.get('cache-control').includes('max-age=3600'));
  assert.match(await page.text(), /GreenWeb Monitor/);
  assert.equal(page.headers.get('x-powered-by'), null);
  assert.ok(page.headers.get('content-security-policy').includes("script-src 'self'"));
  const response = await fetch(`${origin}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ url: 'https://example.com/' }) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).estimatedCO2eGrams, 0.1482);
  const large = await fetch(`${origin}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'a'.repeat(5000) });
  assert.equal(large.status, 413);
});
