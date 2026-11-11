import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).split('// A finite, skippable brand reveal;')[1].split('\n').slice(1).join('\n');
function harness(reduce=false){
 const listeners={},timers=new Map(),page={inert:false},splash={removed:false,remove(){this.removed=true;}},classes=new Set();
 const preference={matches:reduce,addEventListener(n,f){listeners.preference=f;},removeEventListener(){}};
 const doc={querySelector:s=>s==='.page'?page:splash,documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}},addEventListener:(n,f)=>listeners[n]=f,removeEventListener:n=>delete listeners[n]};
 vm.runInNewContext(code,{document:doc,window:{addEventListener:(n,f)=>listeners[n]=f},matchMedia:()=>preference,setTimeout:(f,ms)=>{timers.set(1,{f,ms});return 1;},clearTimeout:id=>timers.delete(id)});
 return {page,splash,classes,listeners,timers};
}
test('entry unlocks content and removes decoration after its finite timeout',()=>{const a=harness();assert.equal(a.page.inert,true);assert.equal(a.timers.get(1).ms,2450);a.timers.get(1).f();assert.equal(a.page.inert,false);assert.equal(a.splash.removed,true);assert.equal(a.classes.size,0);});
test('Escape skips the reveal without leaving the page locked',()=>{const a=harness();a.listeners.keydown({key:'Escape'});assert.equal(a.page.inert,false);assert.equal(a.timers.size,0);assert.equal(a.splash.removed,true);});
test('reduced motion bypasses the reveal entirely',()=>{const a=harness(true);assert.equal(a.page.inert,false);assert.equal(a.timers.size,0);assert.equal(a.splash.removed,true);});
