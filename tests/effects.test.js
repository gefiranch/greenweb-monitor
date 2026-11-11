import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const code = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
function preference(matches=false) { return { matches, addEventListener(_event, fn) { this.change=fn; } }; }
function motion() { return { cancelled:false, onfinish:null, cancel() { this.cancelled=true; } }; }
function waterHarness() {
 const reduced=preference(),fine=preference(true),nodes=[],animations=[],timers=new Map();
 const classes={add(){},remove(){},toggle(){}};
 const node=()=>({style:{},classList:classes,setAttribute(){},getAnimations:()=>[],animate(frames,options){animations.push({frames,options});return motion();}});
 const layer={appendChild(el){nodes.push(el);},animate(){}};
 const doc={hidden:false,body:{appendChild(){}},documentElement:{classList:classes,addEventListener(){}},listeners:{},querySelector:()=>layer,createElement:node,addEventListener(n,f){this.listeners[n]=f;}};
 vm.runInNewContext(code.slice(code.indexOf('// Cursor water:'),code.indexOf('// Compact mobile')), {document:doc,window:{addEventListener(){}},matchMedia:q=>q.includes('reduced')?reduced:fine,setInterval:fn=>{timers.set(1,fn);return 1;},clearInterval:id=>timers.delete(id)});
 return {doc,reduced,fine,nodes,animations,timers,move:(type='mouse')=>doc.listeners.pointermove({clientX:30,clientY:40,pointerType:type,target:{closest:()=>null}})};
}
test('sonar stays idle on movement and supports rapid background clicks with a bounded pool',()=>{
 const a=waterHarness();a.move();a.move();assert.equal(a.animations.length,0);assert.equal(a.timers.size,0);
 for(let i=0;i<25;i++)a.doc.listeners.pointerdown({pointerType:'mouse',button:0,clientX:i,clientY:40,target:{closest:()=>null}});
 assert.equal(a.nodes.length,12);assert.equal(a.animations.length,25);assert.equal(a.animations[0].options.duration,1100);
 assert.equal(a.nodes[0].style.left,'24px');
});
test('sonar ignores controls, touch, reduced motion and hidden tabs',()=>{
 const a=waterHarness();const e={pointerType:'mouse',button:0,clientX:30,clientY:40,target:{closest:()=>null}};
 a.doc.listeners.pointerdown({...e,target:{closest:()=>({})}});
 a.doc.listeners.pointerdown({...e,pointerType:'touch'});
 a.reduced.matches=true;a.doc.listeners.pointerdown(e);
 a.reduced.matches=false;a.doc.hidden=true;a.doc.listeners.pointerdown(e);
 assert.equal(a.animations.length,0);
});
function disclosureHarness({reduce=false,hash=''}={}) {
  const reduced=preference(reduce), animations=[], listeners={}, links=[];
  const summary={attributes:{},listeners:{},getBoundingClientRect:()=>({height:62}),setAttribute(n,v){this.attributes[n]=v;},addEventListener(n,fn){this.listeners[n]=fn;},focus(){this.focused=true;}};
  const child={};const body={inert:false,contains:el=>el===child};
  const panel={open:false,style:{},dataset:{},measuredHeight:null,querySelector:s=>s==='summary'?summary:body,getBoundingClientRect(){if(this.measuredHeight!==null){const height=this.measuredHeight;this.measuredHeight=null;return {height};}return {height:this.open?240:64};},animate(frames,options){const a=motion();animations.push({frames,options,a});return a;}};
  const doc={hidden:false,activeElement:null,querySelector:()=>panel,querySelectorAll:()=>links,addEventListener:(name,fn)=>listeners[name]=fn};
  const win={addEventListener:(name,fn)=>listeners[name]=fn};
  vm.runInNewContext(code.slice(code.indexOf('// Smooth methodology:'),code.indexOf('// Decorative globe:')), {document:doc,window:win,location:{hash},matchMedia:()=>reduced});
  return {panel,summary,body,child,doc,reduced,animations,listeners,click:()=>summary.listeners.click({preventDefault(){}}),finish(){animations.at(-1).a.onfinish?.();}};
}
test('disclosure animates both directions and hides closing content accessibly',()=>{
  const app=disclosureHarness();assert.equal(app.body.inert,true);
  app.click();assert.equal(app.panel.open,true);assert.equal(app.body.inert,false);
  assert.equal(app.animations[0].frames[0].height,'64px');assert.equal(app.animations[0].frames[1].height,'240px');
  app.finish();assert.equal(app.panel.style.height,'');
  app.doc.activeElement=app.child;app.click();assert.equal(app.panel.open,true);assert.equal(app.body.inert,true);assert.equal(app.summary.focused,true);
  assert.equal(app.animations[1].frames[1].height,'64px');app.finish();assert.equal(app.panel.open,false);
  assert.equal(app.summary.attributes['aria-expanded'],'false');assert.equal(app.panel.style.overflow,'');
});
test('rapid disclosure reversal starts from the rendered height and cancels stale completion',()=>{
  const app=disclosureHarness();app.click();const first=app.animations[0].a;
  app.panel.measuredHeight=135;app.click();assert.equal(first.cancelled,true);assert.equal(first.onfinish,null);
  assert.equal(app.animations[1].frames[0].height,'135px');app.finish();assert.equal(app.panel.open,false);
});
test('reduced motion, resize and hidden tab settle disclosure without stale dimensions',()=>{
  const app=disclosureHarness({reduce:true});app.click();assert.equal(app.animations.length,0);assert.equal(app.panel.open,true);
  app.reduced.matches=false;app.click();app.listeners.resize();assert.equal(app.panel.open,false);assert.equal(app.panel.style.height,'');
  app.click();app.doc.hidden=true;app.listeners.visibilitychange();assert.equal(app.panel.open,true);assert.equal(app.panel.style.height,'');
  app.doc.hidden=false;app.click();app.reduced.matches=true;app.reduced.change();assert.equal(app.panel.open,false);
});
test('direct methodology fragments open without trapping content',()=>{
  for(const hash of ['#methodology','#method-details']){const app=disclosureHarness({hash});assert.equal(app.panel.open,true);assert.equal(app.body.inert,false);assert.equal(app.animations.length,0);}
});
