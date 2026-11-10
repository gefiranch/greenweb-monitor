import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { pageSpeedFixture } from './fixture.js';
import { normalizePageSpeed } from '../src/pagespeed.js';
import { estimateCarbon, hostingAssumption } from '../src/carbon.js';

// A small DOM harness runs the actual browser script. No fixture enters the build.
function element() {
  return { hidden: true, value: '', textContent: '', disabled: false, readOnly: false, children: [], attributes: {}, dataset: {}, listeners: {},
    addEventListener(name, listener) { this.listeners[name] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    replaceChildren() { this.children = []; },
    append(...children) { this.children.push(...children); },
    focus() { this.focused = true; },
  };
}
async function harness(fetchImpl) {
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const document = { querySelector: selector => get(selector.slice(1)), getElementById: get, createElement: element, documentElement: element(), hidden: false, listeners: {}, addEventListener(name, listener) { this.listeners[name] = listener; } };
  vm.runInNewContext(await readFile(new URL('../public/app.js', import.meta.url), 'utf8'), { document, fetch: fetchImpl, URL, AbortController, setTimeout, clearTimeout, TypeError, console });
  return { get, document, submit: () => get('analyze-form').listeners.submit({ preventDefault() {} }) };
}
function fixtureResult(recommendations) {
  const result = normalizePageSpeed(pageSpeedFixture());
  return { ...result, ...(recommendations ? { recommendations } : {}), estimatedCO2eGrams: estimateCarbon(result.transferBytes), carbonModel: 'SWDM v4', hostingAssumption };
}
test('frontend hides results for invalid input without sending a request', async () => {
  let calls = 0; const app = await harness(() => { calls++; });
  app.get('website-url').value = 'bad-url';
  await app.submit();
  assert.equal(calls, 0); assert.equal(app.get('results').hidden, true);
  assert.equal(app.get('error-message').hidden, false);
  assert.equal(app.get('website-url').attributes['aria-invalid'], 'true');
});
test('frontend loading prevents duplicate submissions and restores controls', async () => {
  let finish, calls = 0;
  const app = await harness(() => { calls++; return new Promise(resolve => { finish = () => resolve(Response.json(fixtureResult())); }); });
  app.get('website-url').value = 'https://example.com/';
  const pending = app.submit();
  assert.equal(app.get('analyze-button').disabled, true);
  assert.equal(app.get('website-url').readOnly, true);
  assert.equal(app.get('analysis-status').hidden, false);
  await app.submit(); assert.equal(calls, 1);
  finish(); await pending;
  assert.equal(app.get('analyze-button').disabled, false);
  assert.equal(app.get('analysis-status').hidden, true);
  assert.equal(app.get('results').hidden, false);
  assert.equal(app.get('performance-score').textContent, 94);
  assert.equal(app.get('carbon-value').textContent, '0.1482');
  assert.equal(app.get('recommendation-list').children.length, 1);
  assert.ok(app.get('results').focused);
});
test('frontend recovers from upstream error and allows successful reanalysis', async () => {
  let calls = 0;
  const app = await harness(async () => ++calls === 1 ? Response.json({ error: { code: 'UPSTREAM_QUOTA_EXCEEDED', message: 'Quota exhausted. Try later.' } }, { status: 503 }) : Response.json(fixtureResult([])));
  app.get('website-url').value = 'https://example.com/';
  await app.submit();
  assert.equal(app.get('results').hidden, true);
  assert.equal(app.get('error-message').textContent, 'Quota exhausted. Try later.');
  assert.equal(app.get('analyze-button').disabled, false);
  await app.submit();
  assert.equal(app.get('results').hidden, false);
  assert.equal(app.get('error-message').hidden, true);
  assert.equal(app.get('no-recommendations').hidden, false);
});
test('frontend renders upstream strings as text rather than HTML', async () => {
  const result = fixtureResult([{ id: 'unused-javascript', title: '<script>alert(1)</script>', suggestion: '<img src=x>', finding: '<b>payload</b>' }]);
  const app = await harness(async () => Response.json(result));
  app.get('website-url').value = 'https://example.com/'; await app.submit();
  const li = app.get('recommendation-list').children[0];
  assert.equal(li.children[0].textContent, '<script>alert(1)</script>');
  assert.equal(li.children[1].textContent, '<img src=x>');
});

test('result motion follows the submission method, with keyboard as the default', async () => {
  const app = await harness(async () => Response.json(fixtureResult()));
  app.get('website-url').value = 'https://example.com/';
  await app.submit();
  assert.equal(app.get('results').dataset.motion, 'keyboard');
  app.get('analyze-form').listeners.pointerdown();
  await app.submit();
  assert.equal(app.get('results').dataset.motion, 'pointer');
  app.get('analyze-form').listeners.keydown();
  await app.submit();
  assert.equal(app.get('results').dataset.motion, 'keyboard');
});
test('page visibility lets CSS pause activity motion in a background tab', async () => {
  const app = await harness(() => { throw new Error('No network needed'); });
  app.document.hidden = true;
  app.document.listeners.visibilitychange();
  assert.equal(app.document.documentElement.dataset.pageHidden, 'true');
  app.document.hidden = false;
  app.document.listeners.visibilitychange();
  assert.equal(app.document.documentElement.dataset.pageHidden, 'false');
});

test('bare domains get HTTPS without changing explicit protocols', async () => {
  const requests = [];
  const app = await harness(async (_url, options) => { requests.push(JSON.parse(options.body).url); return Response.json(fixtureResult()); });
  for (const [value, expected] of [[' example.com/page?x=1 ', 'https://example.com/page?x=1'], ['http://example.com', 'http://example.com']]) {
    app.get('website-url').value = value; await app.submit();
    assert.equal(requests.at(-1), expected); assert.equal(app.get('website-url').value, expected);
  }
  for (const value of ['javascript:alert(1)', 'ftp://example.com', 'user:secret@example.com']) {
    app.get('website-url').value = value; await app.submit();
    assert.equal(app.get('error-message').hidden, false);
  }
  assert.equal(requests.length, 2);
});
test('example and clear controls edit the input without an API call', async () => {
  let calls = 0; const app = await harness(() => { calls++; });
  app.get('example-url').listeners.click();
  assert.equal(app.get('website-url').value, 'https://example.com');
  assert.equal(app.get('clear-url').hidden, false);
  app.get('clear-url').listeners.click();
  assert.equal(app.get('website-url').value, '');
  assert.equal(app.get('clear-url').hidden, true); assert.equal(calls, 0);
});
test('stopping a request aborts the browser fetch and restores the form', async () => {
  let signal;
  const app = await harness((_url, options) => new Promise((_resolve, reject) => {
    signal = options.signal; signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  app.get('website-url').value = 'example.com';
  const pending = app.submit();
  app.get('cancel-analysis').listeners.click(); await pending;
  assert.equal(signal.aborted, true);
  assert.equal(app.get('website-url').readOnly, false);
  assert.equal(app.get('analyze-button').disabled, false);
  assert.equal(app.get('error-message').hidden, true);
  assert.equal(app.get('results').hidden, true);
  assert.match(app.get('analysis-status').textContent, /Stopped waiting/);
});
