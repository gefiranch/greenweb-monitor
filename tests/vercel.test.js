import test from 'node:test';
import assert from 'node:assert/strict';
import app, {createApp} from '../src/server.js';

test('Vercel entry default-exports a callable Express application', () => {
  assert.equal(typeof app, 'function');
  assert.equal(typeof app.handle, 'function');
  assert.equal(typeof createApp, 'function');
});

test('exported Vercel app serves the document without express.static', async t => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/index.html']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /id="analyze-form"/);
  }
  const api = await fetch(base + '/api/analyze');
  assert.equal(api.status, 405);
});
