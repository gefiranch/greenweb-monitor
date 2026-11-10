import assert from 'node:assert/strict';
import { pageSpeedFixture } from '../tests/fixture.js';
const originalFetch = globalThis.fetch;
let upstreamCalls = 0;
globalThis.fetch = async url => {
  assert.equal(new URL(url).hostname, 'www.googleapis.com');
  upstreamCalls++;
  return Response.json(pageSpeedFixture());
};
try {
  const { default: worker } = await import('../dist/server/index.js');
  for (const [path, type] of [['/', 'text/html'], ['/styles.css', 'text/css'], ['/app.js', 'text/javascript']]) {
    const response = await worker.fetch(new Request(`https://greenweb.example${path}`), {});
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('Content-Type').startsWith(type));
    const text = await response.text();
    assert.ok(text.length > 100);
    if (path === '/') {
      assert.match(text, /styles\.css\?v=[a-f0-9]{12}/);
      assert.match(text, /app\.js\?v=[a-f0-9]{12}/);
    }
  }
  const response = await worker.fetch(new Request('https://greenweb.example/api/analyze', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://example.com/' }),
  }), {});
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.estimatedCO2eGrams, 0.1482);
  assert.equal(result.transferBytes, 1000000);
  assert.equal(result.carbonModel, 'SWDM v4');
  assert.equal(upstreamCalls, 1);
  console.info('Built Worker: three assets and integrated API passed (test-only PageSpeed fixture, real CO2.js).');
} finally { globalThis.fetch = originalFetch; }
