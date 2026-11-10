import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

async function globeHarness(reduce = false) {
  const source = (await readFile(new URL('../public/app.js', import.meta.url), 'utf8')).split('// Decorative globe:')[1];
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, { dataset: {}, listeners: {}, attributes: {},
      addEventListener(name, fn) { this.listeners[name] = fn; },
      setAttribute(name, value) { this.attributes[name] = value; },
      getBoundingClientRect() { return {width: 800, height: 310, left: 0, top: 0}; }
    });
    return elements.get(id);
  };
  let arcs = [];
  let draws = 0, pending = new Map(), serial = 0, intersection;
  const gradient = { addColorStop() {} };
  const context = new Proxy({ clearRect() { draws++; arcs=[]; }, arc(...args) { arcs.push(args); }, createRadialGradient() { return gradient; } }, {get(target, key) { return target[key] ?? (() => {}); }});
  get('globe-canvas').getContext = () => context;
  const preference = {matches: reduce, addEventListener(_event, fn) { this.change = fn; }};
  const doc = {querySelector: selector => get(selector.slice(1)), hidden: false, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }};
  vm.runInNewContext('// Decorative globe:' + source, {
    document: doc, devicePixelRatio: 3,
    matchMedia: query => query.includes('reduced-motion') ? preference : {matches: true},
    requestAnimationFrame: fn => { const id = ++serial; pending.set(id,fn); return id; },
    cancelAnimationFrame: id => pending.delete(id),
    IntersectionObserver: class { constructor(fn) { intersection=fn; } observe() {} },
    ResizeObserver: class { observe() {} }
  });
  return {get, doc, preference, visible: value => intersection([{isIntersecting: value}]),
    get arcs() {return arcs;}, get pending() {return pending.size;}, get draws() {return draws;},
    tick(time) {const callbacks=[...pending.values()];pending.clear();for (const fn of callbacks) fn(time);}
  };
}
test('globe suspends all frame callbacks offscreen, in hidden tabs, without manual controls', async () => {
  const app=await globeHarness(); assert.equal(app.pending,0);
  assert.equal(app.get('globe-canvas').width,1200); // pixel ratio is capped
  app.visible(true); assert.equal(app.pending,1);
  app.doc.hidden=true; app.doc.listeners.visibilitychange(); assert.equal(app.pending,0);
  app.doc.hidden=false; app.doc.listeners.visibilitychange(); assert.equal(app.pending,1);
  app.visible(false); assert.equal(app.pending,0);
});
test('reduced motion draws a static globe and responds to preference changes', async () => {
  const app=await globeHarness(true);app.visible(true);
  assert.equal(app.pending,0);
  assert.equal(app.draws,1);
  app.preference.matches=false;app.preference.change();assert.equal(app.pending,1);
  app.preference.matches=true;app.preference.change();assert.equal(app.pending,0);
});
test('globe redraws at a bounded cadence and resuming does not catch up hidden time', async () => {
  const app=await globeHarness();app.visible(true);
  const initial=app.draws;
  for(let time=1;time<=1001;time+=8)app.tick(time);
  assert.ok(app.draws-initial >= 20 && app.draws-initial <= 30);
  app.visible(false);const paused=app.draws;
  app.tick(50000);assert.equal(app.draws,paused);
  app.visible(true);app.tick(60000);assert.equal(app.draws,paused);
  app.tick(60040);assert.equal(app.draws,paused+1);
});


test('hover moves and brightens surface geometry without invalid canvas coordinates', async () => {
  const idle=await globeHarness(), hovered=await globeHarness();
  idle.visible(true);hovered.visible(true);
  hovered.get('globe-stage').listeners.pointerenter({clientX:400,clientY:90});
  for(let time=1;time<=501;time+=40){idle.tick(time);hovered.tick(time);}
  assert.notDeepEqual(hovered.arcs,idle.arcs);
  assert.ok(hovered.arcs.flat().every(Number.isFinite));
  hovered.get('globe-stage').listeners.pointerleave();
  for(let time=541;time<=1001;time+=40)hovered.tick(time);
  assert.ok(hovered.arcs.flat().every(Number.isFinite));
  assert.equal(hovered.pending,1);
});
