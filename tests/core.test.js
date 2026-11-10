import test from 'node:test';
import assert from 'node:assert/strict';
import { co2 } from '@tgwf/co2';
import { validateUrl } from '../src/validation.js';
import { estimateCarbon } from '../src/carbon.js';
import { analyzePageSpeed, normalizePageSpeed } from '../src/pagespeed.js';
import { getRecommendations, getPassedChecks } from '../src/recommendations.js';
import { pageSpeedFixture } from './fixture.js';

for (const value of ['https://example.com', 'http://example.com/page?q=one', 'https://8.8.8.8', 'https://[2606:4700:4700::1111]/', 'https://例え.jp/']) {
  test(`accepts public URL ${value}`, () => assert.match(validateUrl(value), /^https?:/));
}
for (const value of ['', null, 42, 'example.com', 'ftp://example.com', 'javascript:alert(1)', 'https://user:pass@example.com', 'http://localhost', 'http://foo.localhost', 'http://foo.internal', 'http://foo.local', 'http://metadata.google.internal', 'http://printer', 'http://example.com:1234', 'http://127.0.0.1', 'http://127.1', 'http://2130706433', 'http://0x7f000001', 'http://10.0.0.1', 'http://172.16.0.1', 'http://192.168.1.1', 'http://169.254.169.254', 'http://100.64.0.1', 'http://0.0.0.0', 'http://224.0.0.1', 'http://[::1]', 'http://[fc00::1]', 'http://[fe80::1]', 'http://[::ffff:127.0.0.1]', 'http://localhost.', 'https://a..com', 'https://example.com/a b', 'https://example.com/\\evil', `https://example.com/${'a'.repeat(2048)}`]) {
  test(`rejects invalid/internal URL ${String(value).slice(0, 65)}`, () => assert.throws(() => validateUrl(value), e => e.code === 'INVALID_URL'));
}
test('strips fragments but retains meaningful path/query', () => assert.equal(validateUrl(' https://example.com/path?q=yes#foo '), 'https://example.com/path?q=yes'));
test('CO2 calculation uses the real explicit v4 model with non-green hosting', () => {
  const real = new co2({ model: 'swd', version: 4 });
  const v3 = new co2({ model: 'swd', version: 3 });
  assert.equal(real.model.version, 4);
  assert.equal(estimateCarbon(1000000), real.perVisit(1000000, false));
  assert.notEqual(estimateCarbon(1000000), v3.perVisit(1000000, false));
  assert.ok(Math.abs(estimateCarbon(1000000) - 0.1482) < 1e-10);
  assert.equal(estimateCarbon(0), 0);
});
for (const value of [-1, NaN, Infinity, undefined, '1000', 1.5, Number.MAX_SAFE_INTEGER + 1]) {
  test(`rejects invalid carbon input ${value}`, () => assert.throws(() => estimateCarbon(value)));
}
test('normalizes score, bytes, mobile strategy, final URL and timestamp', () => {
  const result = normalizePageSpeed(pageSpeedFixture());
  assert.equal(result.performanceScore, 94);
  assert.equal(result.transferBytes, 1000000);
  assert.equal(result.strategy, 'mobile');
  assert.equal(result.url, 'https://example.com/');
  assert.equal(result.recommendations[0].id, 'unused-javascript');
});
for (const mutate of [d => delete d.lighthouseResult, d => delete d.lighthouseResult.categories, d => d.lighthouseResult.categories.performance.score = null, d => delete d.lighthouseResult.audits['total-byte-weight'], d => d.lighthouseResult.audits['total-byte-weight'].numericUnit = 'kilobyte', d => d.lighthouseResult.audits['total-byte-weight'].numericValue = -1, d => d.lighthouseResult.fetchTime = 'bad', d => d.lighthouseResult.configSettings.formFactor = 'desktop']) {
  test('rejects incomplete or inconsistent PageSpeed data', () => {
    const fixture = pageSpeedFixture(); mutate(fixture);
    assert.throws(() => normalizePageSpeed(fixture), e => e.code === 'INCOMPLETE_RESPONSE');
  });
}
test('handles Lighthouse runtime failure', () => {
  const data = pageSpeedFixture(); data.lighthouseResult.runtimeError = { message: 'sensitive error' };
  assert.throws(() => normalizePageSpeed(data), e => e.code === 'ANALYSIS_FAILED' && !e.message.includes('sensitive'));
});
test('handles absent optional audits', () => {
  const data = pageSpeedFixture(); delete data.lighthouseResult.audits['unused-javascript'];
  assert.deepEqual(normalizePageSpeed(data).recommendations, []);
  assert.deepEqual(getRecommendations(), []);
});
test('recommendations use failed supported audits, deduplicate and cap at five', () => {
  const ids = ['unused-javascript', 'unused-css-rules', 'modern-image-formats', 'image-delivery-insight', 'render-blocking-resources', 'total-byte-weight', 'unminified-css', 'uses-text-compression'];
  const audits = Object.fromEntries(ids.map(id => [id, { score: 0.2 }]));
  audits['unused-javascript'].score = 1;
  audits['unused-css-rules'].scoreDisplayMode = 'error';
  const result = getRecommendations(audits);
  assert.equal(result.length, 5);
  assert.ok(!result.some(r => ['unused-javascript', 'unused-css-rules'].includes(r.id)));
  assert.equal(result.filter(r => /image/.test(r.id)).length, 1);
});
test('calls only Google, once, with mobile performance and server-side key', async () => {
  let calls = 0;
  const result = await analyzePageSpeed('https://example.com/', { apiKey: 'test-secret', fetchImpl: async (url) => {
    calls++; const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://www.googleapis.com');
    assert.equal(parsed.searchParams.get('strategy'), 'mobile');
    assert.equal(parsed.searchParams.get('category'), 'performance');
    assert.equal(parsed.searchParams.get('key'), 'test-secret');
    return Response.json(pageSpeedFixture());
  } });
  assert.equal(calls, 1); assert.equal(result.performanceScore, 94);
  assert.ok(!JSON.stringify(result).includes('test-secret'));
});
for (const [status, code, body] of [[429, 'UPSTREAM_QUOTA_EXCEEDED'], [403, 'API_CONFIGURATION_ERROR'], [401, 'API_CONFIGURATION_ERROR'], [400, 'API_CONFIGURATION_ERROR', { error: { message: 'API key not valid' } }], [400, 'ANALYSIS_FAILED'], [500, 'UPSTREAM_ERROR']]) {
  test(`safe error for upstream HTTP ${status} (${code})`, async () => assert.rejects(analyzePageSpeed('https://example.com/', { fetchImpl: async () => Response.json(body ?? {}, { status }) }), e => e.code === code));
}
test('maps network failure', async () => assert.rejects(analyzePageSpeed('https://example.com/', { fetchImpl: async () => { throw new TypeError('secret internal hostname'); } }), e => e.code === 'NETWORK_ERROR' && !e.message.includes('secret')));
test('times out and aborts upstream request', async () => assert.rejects(analyzePageSpeed('https://example.com/', { timeoutMs: 5, fetchImpl: async (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))) }), e => e.code === 'API_TIMEOUT'));
test('rejects non-JSON upstream response', async () => assert.rejects(analyzePageSpeed('https://example.com/', { fetchImpl: async () => new Response('<html>error</html>') }), e => e.code === 'INCOMPLETE_RESPONSE'));

test('impact bands follow savings thresholds rather than audit severity', () => {
  for (const [bytes, ms, expected] of [[0, 0, 'low'], [20479, 99, 'low'], [20480, 0, 'medium'], [0, 100, 'medium'], [102399, 499, 'medium'], [102400, 0, 'high'], [0, 500, 'high']]) {
    for (const score of [0, .4, .8, .95]) {
      const [finding] = getRecommendations({ 'unused-javascript': { score, details: { overallSavingsBytes: bytes, overallSavingsMs: ms } } });
      assert.equal(finding.priority, expected);
      assert.match(finding.impactEvidence, /Estimated savings/);
    }
  }
  for (const score of [null, undefined, NaN, Infinity, -1, 2, '1']) {
    const audits = { 'unused-javascript': { score } };
    assert.deepEqual(getRecommendations(audits), []);
    assert.deepEqual(getPassedChecks(audits), []);
  }
  for (const scoreDisplayMode of ['error', 'manual', 'notApplicable', 'not_applicable']) {
    assert.deepEqual(getRecommendations({ 'unused-javascript': { score: .1, scoreDisplayMode, details: { overallSavingsMs: 500 } } }), []);
    assert.deepEqual(getPassedChecks({ 'unused-javascript': { score: 1, scoreDisplayMode } }), []);
  }
});
test('missing and invalid savings are unclassified, never green', () => {
  for (const value of [undefined, null, -1, NaN, Infinity, '1000']) {
    const [finding] = getRecommendations({ 'unused-javascript': { score: 0, details: { overallSavingsMs: value, overallSavingsBytes: value } } });
    assert.equal(finding.priority, 'unknown');
    assert.equal(finding.savingsMs, null);
  }
});
test('metric savings take the largest valid estimate without summing or using payload', () => {
  const [finding] = getRecommendations({ 'unused-javascript': { score: .95, details: { overallSavingsMs: 0 }, metricSavings: { FCP: 120, LCP: 510 } } });
  assert.equal(finding.savingsMs, 510);
  assert.equal(finding.priority, 'high');
  assert.equal(getRecommendations({ 'total-byte-weight': { score: .1, numericValue: 9000000 } })[0].priority, 'unknown');
});
test('largest savings rank first and win related audit groups despite higher scores', () => {
  const audits = {
    'unused-javascript': { score: 0, details: { overallSavingsBytes: 1000 } },
    'unused-css-rules': { score: .5, details: { overallSavingsBytes: 25000 } },
    'modern-image-formats': { score: 0, details: { overallSavingsMs: 50 } },
    'image-delivery-insight': { score: .95, metricSavings: { LCP: 700 } },
    'render-blocking-insight': { score: .1, metricSavings: { FCP: 1000 } },
  };
  assert.deepEqual(getRecommendations(audits).map(item => item.id), ['render-blocking-insight', 'image-delivery-insight', 'unused-css-rules', 'unused-javascript']);
});
test('passing checks never become low-impact advice or contradict a related finding', () => {
  const audits = { 'modern-image-formats': { score: 1 }, 'image-delivery-insight': { score: .95, details: { overallSavingsBytes: 1000 } } };
  assert.equal(getRecommendations(audits)[0].priority, 'low');
  assert.deepEqual(getPassedChecks(audits), []);
  assert.deepEqual(getRecommendations({ 'unused-javascript': { score: 1, details: { overallSavingsMs: 1000 } } }), []);
});
