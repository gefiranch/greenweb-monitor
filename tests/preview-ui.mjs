// Manual UI checks only. Never imported by the production server or Worker.
// Google responses are synthetic; the application still runs the real CO2.js model.
import { createServer } from 'node:http';
import { createApp } from '../src/server.js';
import { pageSpeedFixture } from './fixture.js';

const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]) || 3001;
const host = args.includes('--host') ? args[args.indexOf('--host') + 1] : '127.0.0.1';
const app = createApp({ fetchImpl: async () => { await new Promise(resolve => setTimeout(resolve, 1800)); const fixture = pageSpeedFixture(); fixture.lighthouseResult.audits['unused-css-rules'] = { score: .1, displayValue: 'Potential savings of 12 KiB', details: { overallSavingsBytes: 12288 } }; fixture.lighthouseResult.audits['render-blocking-insight'] = { score: .9, displayValue: 'Potential savings of 600 ms', metricSavings: { LCP: 600 } }; return Response.json(fixture); } });
const harness = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GreenWeb UI QA</title>
<style>body{margin:0;background:#ddd;color:#111;font:14px system-ui}header{padding:12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}iframe{display:block;border:0;height:840px;background:#000;margin:0 auto;max-width:100%}button{padding:8px 14px;cursor:pointer}</style>
<header><strong>UI testing only: synthetic PageSpeed response, real CO2.js.</strong><button data-width="390">390 px</button><button data-width="360">360 px</button><button data-width="960">960 px</button><span id="size">390 px viewport</span></header>
<iframe title="GreenWeb Monitor test viewport" src="/?qa=priorities" width="390"></iframe><script>for(const button of document.querySelectorAll('button'))button.addEventListener('click',()=>{document.querySelector('iframe').width=button.dataset.width;document.getElementById('size').textContent=button.dataset.width+' px viewport';});</script></html>`;
createServer((request, response) => {
  if (request.url === '/_qa') {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(harness);
    return;
  }
  // Same-origin framing is enabled only in this fixture-only test server.
  const setHeader = response.setHeader.bind(response);
  response.setHeader = (name, value) => setHeader(name, name.toLowerCase() === 'content-security-policy' ? value.replace("frame-ancestors 'none'", "frame-ancestors 'self'") : value);
  app(request, response);
}).listen(port, host, () => console.info(`Fixture-only UI preview on port ${port}; open /_qa for viewport checks.`));
