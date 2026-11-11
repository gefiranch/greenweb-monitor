const form = document.querySelector('#analyze-form');
const input = document.querySelector('#website-url');
const button = document.querySelector('#analyze-button');
const status = document.querySelector('#analysis-status');
const error = document.querySelector('#error-message');
const results = document.querySelector('#results');
let busy = false;
let activeController;
let cancelled = false;
const clearButton = document.querySelector('#clear-url');
const progress = document.querySelector('#audit-progress');
const cancelButton = document.querySelector('#cancel-analysis');
function updateField() {
  clearButton.hidden = !input.value || busy;
}
function normalizeInput(value) {
  const trimmed = value.trim();
  // Only infer HTTPS for a plausible domain; never reinterpret another scheme.
  return !/^[a-z][a-z\d+.-]*:/i.test(trimmed) && /^[^\s/:]+\.[^\s/:]+(?:[/?#]|$)/.test(trimmed)
    ? `https://${trimmed}` : trimmed;
}
const text = (id, value) => { document.getElementById(id).textContent = value; };

function renderResults(data, motion) {
  text('result-url', data.url);
  text('performance-score', data.performanceScore);
  text('performance-label', data.performanceScore >= 90 ? 'Good · 90–100' : data.performanceScore >= 50 ? 'Needs improvement · 50–89' : 'Poor · 0–49');
  const useMB = data.transferBytes >= 1000000;
  text('transfer-size', (data.transferBytes / (useMB ? 1000000 : 1000)).toLocaleString(undefined, { maximumFractionDigits: 2 }));
  text('transfer-unit', useMB ? ' MB' : ' KB');
  text('transfer-bytes', `${data.transferBytes.toLocaleString()} bytes transferred`);
  text('carbon-value', data.estimatedCO2eGrams > 0 && data.estimatedCO2eGrams < 0.0001 ? '<0.0001' : data.estimatedCO2eGrams.toLocaleString(undefined, { maximumFractionDigits: 4 }));
  text('hosting-assumption', data.hostingAssumption);
  const time = document.getElementById('analysis-time');
  time.dateTime = data.analyzedAt;
  time.textContent = new Date(data.analyzedAt).toLocaleString();
  text('high-count', data.recommendations.filter(item => item.priority === 'high').length);
  text('medium-count', data.recommendations.filter(item => item.priority === 'medium').length);
  text('low-count', data.recommendations.filter(item => item.priority === 'low').length);
  const list = document.getElementById('recommendation-list');
  list.replaceChildren();
  for (const item of data.recommendations) {
    const li = document.createElement('li');
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    const suggestion = document.createElement('p');
    suggestion.textContent = item.suggestion;
    const finding = document.createElement('p');
    finding.className = 'finding';
    finding.textContent = ['high', 'medium', 'low'].includes(item.priority) && item.impactEvidence ? item.impactEvidence : item.finding;
    const priority = document.createElement('span');
    const level = item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : item.priority === 'low' ? 'low' : 'unknown';
    li.dataset.priority = level;
    priority.className = `priority-badge priority-${level}`;
    priority.textContent = level === 'high' ? 'High impact' : level === 'medium' ? 'Medium impact' : level === 'low' ? 'Low impact' : 'Impact not estimated';
    li.append(heading, suggestion, finding, priority);
    list.append(li);
  }
  text('recommendation-count', `${data.recommendations.length} ${data.recommendations.length === 1 ? 'finding' : 'findings'}`);
  document.getElementById('no-recommendations').hidden = data.recommendations.length > 0;
  results.dataset.motion = motion;
  results.hidden = false;
  results.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  error.hidden = true;
  input.removeAttribute('aria-invalid');
  const url = normalizeInput(input.value);
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || url.length > 2048) throw new Error();
  } catch {
    results.hidden = true;
    error.textContent = 'Enter a public domain or HTTP/HTTPS URL, such as example.com.';
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }
  input.value = url;
  const motion = form.dataset.input || 'keyboard';
  busy = true;
  cancelled = false;
  updateField();
  progress.hidden = false;
  cancelButton.hidden = false;
  status.textContent = 'Running your mobile audit. Allow up to 55 seconds.';
  button.disabled = true;
  input.readOnly = true;
  text('analyze-label', 'Analyzing…');
  form.setAttribute('aria-busy', 'true');
  status.hidden = false;
  results.hidden = true;
  const controller = new AbortController();
  activeController = controller;
  const timer = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }), signal: controller.signal });
    let data;
    try { data = await response.json(); } catch { throw new Error('The server returned an unreadable response. Please try again.'); }
    if (!response.ok) {
      if (data.error?.code === 'INVALID_URL') input.setAttribute('aria-invalid', 'true');
      throw new Error(data.error?.message || 'The analysis could not be completed. Please try again.');
    }
    if (!cancelled) renderResults(data, motion);
  } catch (failure) {
    if (cancelled) {
      status.textContent = 'Stopped waiting. Google may still finish this audit; try again shortly.';
    } else {
    error.textContent = controller.signal.aborted ? 'The request took too long. Please try again.' : failure instanceof TypeError ? 'Could not connect to the analyzer. Check your connection and try again.' : failure.message;
    error.hidden = false;
    }
  } finally {
    clearTimeout(timer);
    busy = false;
    button.disabled = false;
    input.readOnly = false;
    text('analyze-label', 'Analyze page');
    activeController = undefined;
    updateField();
    status.hidden = !cancelled;
    progress.hidden = !cancelled;
    cancelButton.hidden = true;
    form.removeAttribute('aria-busy');
  }
});
input.addEventListener('input', () => {
  input.removeAttribute('aria-invalid'); error.hidden = true;
  if (!busy) { progress.hidden = true; status.hidden = true; }
  updateField();
});
clearButton.addEventListener('click', () => {
  if (busy) return;
  input.value = ''; input.removeAttribute('aria-invalid'); error.hidden = true;
  progress.hidden = true; status.hidden = true; updateField(); input.focus();
});
cancelButton.addEventListener('click', () => {
  if (!activeController) return;
  cancelled = true; activeController.abort();
  input.focus();
});
updateField();

form.addEventListener('pointerdown', () => { form.dataset.input = 'pointer'; });
form.addEventListener('keydown', () => { form.dataset.input = 'keyboard'; });
document.addEventListener('visibilitychange', () => { document.documentElement.dataset.pageHidden = String(document.hidden); });

// Cursor water: click-only ripples with a bounded pool and no idle timer.
(() => {
  const layer = document.querySelector('#water-background');
  if (!layer || !document.createElement || typeof layer.animate !== 'function') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const cursor = document.createElement('div'); cursor.className = 'custom-cursor';
  cursor.setAttribute('aria-hidden','true'); cursor.hidden=true; document.body.appendChild(cursor);
  const rings = Array.from({length: 12}, () => { const el=document.createElement('span'); el.className='water-ripple'; layer.appendChild(el); return el; });
  let x=0,y=0,active=false,index=0;
  function pulse() {
    if (reduced.matches || document.hidden || !fine.matches) return;
    const el=rings[index++%rings.length]; el.getAnimations().forEach(a=>a.cancel());
    el.style.left=x+'px'; el.style.top=y+'px';
    el.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.03)'},{opacity:.9,offset:.12},{opacity:.38,offset:.55},{opacity:0,transform:'translate(-50%,-50%) scale(1)'}],{duration:1100,easing:'cubic-bezier(.16,1,.3,1)'});
  }
  function stop() { active=false;document.documentElement.classList.remove('custom-pointer');cursor.hidden=true;rings.forEach(el=>el.getAnimations().forEach(a=>a.cancel())); }
  document.addEventListener('pointermove',e=>{
    if (!fine.matches || e.pointerType==='touch' || document.hidden) return;
    x=e.clientX;y=e.clientY;cursor.style.transform=`translate(${x}px,${y}px)`;
    cursor.classList.toggle('interactive',!!e.target.closest('a,button,summary,input,textarea,select,label,[role="button"],[contenteditable]'));
    cursor.hidden=false;document.documentElement.classList.add('custom-pointer');
    active=true;
  },{passive:true});
  document.addEventListener('pointerover',e=>{if(active)cursor.classList.toggle('interactive',!!e.target.closest('a,button,summary,input,textarea,select,label,[role="button"],[contenteditable]'));},{passive:true});
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch' || e.button!==0 || e.target.closest('a,button,summary,input,textarea,select,label,[role="button"],[contenteditable]'))return;
    if(!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;
    x=e.clientX;y=e.clientY;pulse();
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',stop);
  window.addEventListener('blur',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',stop);fine.addEventListener('change',stop);
})();

// Compact mobile navigation with keyboard and outside-click dismissal.
(() => {
  const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('#main-navigation');
  if(!toggle || !nav || typeof matchMedia !== 'function')return;
  const mobile=matchMedia('(max-width: 640px)');
  function set(open){toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open);nav.inert=mobile.matches&&!open;}
  toggle.addEventListener('click',()=>set(toggle.getAttribute('aria-expanded')!=='true'));
  nav.addEventListener('click',e=>{if(e.target.closest('a'))set(false);});
  document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))set(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){set(false);toggle.focus();}});
  mobile.addEventListener('change',()=>set(false));set(false);
})();

// Smooth methodology: retain native details semantics and no-JS fallback.
(() => {
  const panel = document.querySelector('#methodology');
  if (!panel || typeof panel.animate !== 'function') return;
  const summary = panel.querySelector('summary');
  const body = panel.querySelector('.method-body');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let animation = null, expanded = panel.open;
  function settle() {
    if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
    panel.open = expanded; panel.style.height = ''; panel.style.overflow = '';
    body.inert = !expanded;
    summary.setAttribute('aria-expanded', String(expanded));
    panel.dataset.expanded = String(expanded);
  }
  function setOpen(next, animate = true) {
    const start = panel.getBoundingClientRect().height;
    if (animation) { animation.onfinish = null; animation.cancel(); animation = null; }
    expanded = next;
    if (!next && body.contains(document.activeElement)) summary.focus();
    body.inert = !next;
    summary.setAttribute('aria-expanded', String(next)); panel.dataset.expanded = String(next);
    panel.open = true; panel.style.height = '';
    const end = next ? panel.getBoundingClientRect().height : summary.getBoundingClientRect().height + 2;
    if (reduced.matches || !animate || Math.abs(end-start) < 1) { settle(); return; }
    panel.style.height = `${start}px`; panel.style.overflow = 'hidden';
    animation = panel.animate([{height: `${start}px`}, {height: `${end}px`}], {
      duration: 420, easing: 'cubic-bezier(.22,.75,.25,1)', fill: 'both'
    });
    animation.onfinish = settle;
  }
  summary.addEventListener('click', event => { event.preventDefault(); setOpen(!expanded); });
  for (const link of document.querySelectorAll('a[href="#methodology"]')) {
    link.addEventListener('click', () => { if (!expanded) setOpen(true); });
  }
  const fromHash = () => { if (!expanded && ['#methodology', '#method-details'].includes(location.hash)) setOpen(true, false); };
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('resize', () => { if (animation) settle(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && animation) settle(); });
  reduced.addEventListener('change', () => { if (reduced.matches) settle(); });
  settle(); fromHash();
})();

// Decorative globe: bounded Canvas 2D work, no assets, no WebGL or 3D dependency.
(() => {
  const canvas = document.querySelector('#globe-canvas');
  if (typeof canvas?.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const stage = document.querySelector('#globe-stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let visible = false, hovered = false, frame = 0;
  let hoverAmount = 0, pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  let previous = 0, angle = -.3, speed = .14, phase = 0, travel = 0, width = 0, height = 0;
  const toSphere = (lon, lat) => {
    const a = lon * Math.PI / 180, b = lat * Math.PI / 180;
    return [Math.cos(b) * Math.sin(a), -Math.sin(b), Math.cos(b) * Math.cos(a)];
  };
  // Stylized continental regions are decorative, not geographical data.
  const regions = [
    [[-166,70],[-112,76],[-51,48],[-80,9],[-109,23],[-128,52]],
    [[-82,12],[-40,-4],[-51,-28],[-73,-55],[-79,-12]],
    [[-18,35],[12,38],[50,10],[33,-33],[14,-36],[-9,5]],
    [[-11,36],[-10,61],[38,72],[178,58],[144,32],[123,6],[98,1],[77,8],[55,29],[36,30]],
    [[113,-13],[136,-10],[154,-23],[146,-39],[115,-33]],
    [[-54,59],[-22,65],[-29,82],[-62,80]],
    [[46,-13],[50,-17],[47,-26],[43,-21]]
  ];
  function inRegion(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [a,b] = polygon[i], [c,d] = polygon[j];
      if ((b > y) !== (d > y) && x < (c-a)*(y-b)/(d-b)+a) inside = !inside;
    }
    return inside;
  }
  const dots = [];
  for (let lat = -75; lat <= 80; lat += 3.5) {
    const step = 3.5 / Math.max(.3, Math.cos(lat * Math.PI/180));
    for (let lon = -180; lon < 180; lon += step) {
      if (regions.some(p => inRegion(lon, lat, p))) dots.push(toSphere(lon, lat));
    }
  }
  const grid = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    grid.push(Array.from({length: 73}, (_,i) => toSphere(i*5, lat)));
  }
  for (let lon = 0; lon < 360; lon += 30) {
    grid.push(Array.from({length: 37}, (_,i) => toSphere(lon, i*5-90)));
  }
  const hubs = [[-74,41],[-122,38],[-47,-23],[-.1,51],[13,52],[31,30],[78,28],[104,1],[139,36],[151,-34]].map(([lon,lat]) => toSphere(lon,lat));
  const routes = [[0,3],[0,2],[1,8],[3,4],[3,5],[4,6],[5,7],[6,8],[7,9]].map(([a,b]) => {
    const A=hubs[a], B=hubs[b], points=[];
    for(let i=0;i<=40;i++) {
      const t=i/40, v=A.map((n,k)=>n*(1-t)+B[k]*t), length=Math.hypot(...v);
      const lift=1+Math.sin(t*Math.PI)*.12;
      points.push(v.map(n=>n/length*lift));
    }
    return points;
  });
  function draw() {
    const radius = Math.min(width * .55, height * .94);
    const cx=width/2, cy=height*1.17, co=Math.cos(angle), si=Math.sin(angle);
    function project(p) {
      const x=p[0]*co+p[2]*si, z=p[2]*co-p[0]*si;
      const y=p[1]*.966-z*.259, depth=p[1]*.259+z*.966;
      return [cx+x*radius,cy+y*radius,depth];
    }
    ctx.clearRect(0,0,width,height);
    const halo=ctx.createRadialGradient(cx,cy, radius*.6,cx,cy,radius*1.45);
    halo.addColorStop(0,'rgba(119,169,240,.23)');halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    const sphere=ctx.createRadialGradient(cx-radius*.3,cy-radius*.5,0,cx,cy,radius);
    sphere.addColorStop(0,'#1c304c');sphere.addColorStop(.65,'#09121f');sphere.addColorStop(1,'#03070c');
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=sphere;ctx.fill();
    ctx.strokeStyle='rgba(173,210,255,.48)';ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,radius+2,Math.PI*1.12,Math.PI*1.88);
    ctx.strokeStyle='rgba(132,184,255,.12)';ctx.lineWidth=4;ctx.stroke();
    function line(points, color, thickness, start=0, end=points.length) {
      ctx.beginPath();let pen=false;
      for(let index=start; index<end; index++) {
        const [x,y,z]=project(points[index]);
        if(z<.02){pen=false;continue;}
        if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);
        pen=true;
      }
      ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();
    }
    for(const g of grid)line(g,'rgba(152,180,222,.13)',.65);
    const interactive = hoverAmount > .001;
    const pulse = interactive ? .85 + Math.sin(phase * 2) * .15 : 0;
    const rippleRadius = (phase * 70) % 190;
    for(const d of dots) {
      let [x,y,z]=project(d);if(z<0||y>height+12)continue;
      let influence=0;
      if (interactive) {
        const dx=x-pointerX, dy=y-pointerY;
        const falloff=Math.max(0,1-(dx*dx+dy*dy)/22500);
        const distance=Math.sqrt(dx*dx+dy*dy);
        const ripple=Math.max(0,1-Math.abs(distance-rippleRadius)/28);
        influence=hoverAmount*(falloff*falloff*pulse+ripple*.6);
        x+=dx/150*influence*5;
        y+=dy/150*influence*5;
      }
      const size=.72+z*.65+influence*.85;
      ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);
      ctx.fillStyle=`rgba(184,209,247,${Math.min(1,.32+z*.6+influence*.4)})`;ctx.fill();
    }
    routes.forEach((route,i)=>{
      line(route,'rgba(151,190,244,.24)',.8);
      const t=(travel+i*.137)%1, idx=t*40, a=Math.floor(idx), f=idx-a;
      line(route,`rgba(184,218,255,${.6+hoverAmount*.25})`,1.3,Math.max(0,a-5),a+1);
      const p=route[a].map((n,k)=>n+(route[Math.min(a+1,40)][k]-n)*f);
      const [x,y,z]=project(p);if(z<.02)return;
      ctx.beginPath();ctx.arc(x,y,2.1,0,Math.PI*2);ctx.fillStyle='#e0ecff';ctx.fill();
      ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fillStyle='rgba(171,207,255,.15)';ctx.fill();
    });
    for(let i=0;i<hubs.length;i++){const [x,y,z]=project(hubs[i]);if(z<.05)continue;
      ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#b8d2f7';ctx.fill();
      const wave=(phase*.5+i*.17)%1;
      ctx.beginPath();ctx.arc(x,y,5+wave*7,0,Math.PI*2);ctx.strokeStyle=`rgba(184,218,255,${(1-wave)*.5})`;ctx.lineWidth=.8;ctx.stroke();
    }
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (!previous) { previous=now; return; }
    const elapsed = now-previous;
    if (elapsed < 1000/30) return;
    const dt=Math.min(elapsed/1000,.08); previous=now;
    speed += ((hovered ? .38 : .14)-speed)*(1-Math.exp(-dt*2.5));
    angle=(angle+speed*dt)%(Math.PI*2);phase+=dt;travel=(travel+(.18+hoverAmount*.05)*dt)%1;
    hoverAmount += ((hovered ? 1 : 0)-hoverAmount)*(1-Math.exp(-dt*3.5));
    const pointerEase=1-Math.exp(-dt*8);
    pointerX+=(targetX-pointerX)*pointerEase;
    pointerY+=(targetY-pointerY)*pointerEase;
    draw();
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;previous=0;
    if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function resize() {
    const box=stage.getBoundingClientRect();width=box.width;height=box.height;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  const trackPointer = event => {
    if (!finePointer.matches || reduced.matches) return;
    const box = stage.getBoundingClientRect();
    targetX=event.clientX-box.left;targetY=event.clientY-box.top;
    if (!hovered && hoverAmount < .01) { pointerX=targetX;pointerY=targetY; }
    hovered=true;
  };
  stage.addEventListener('pointerenter',trackPointer);
  stage.addEventListener('pointermove',trackPointer);
  stage.addEventListener('pointerleave',()=>{hovered=false;});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{hovered=false;hoverAmount=0;sync();draw();});
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.05}).observe(stage);
  new ResizeObserver(resize).observe(stage);
  resize();stage.dataset.ready='true';sync();
})();

// A finite, skippable brand reveal; never leave the app locked behind decoration.
(() => {
  const splash=document.querySelector('#entry-splash'),page=document.querySelector('.page');
  if(!splash || !page || typeof splash.remove!=='function' || typeof matchMedia!=='function')return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let timer;
  function finish(){clearTimeout(timer);page.inert=false;document.documentElement.classList.remove('entry-revealing');splash.remove();document.removeEventListener('keydown',skip);reduced.removeEventListener('change',finish);}
  function skip(event){if(event.key==='Escape')finish();}
  if(reduced.matches){splash.remove();return;}
  page.inert=true;document.documentElement.classList.add('entry-revealing');
  document.addEventListener('keydown',skip);reduced.addEventListener('change',finish);
  timer=setTimeout(finish,2450);
  window.addEventListener('pagehide',finish,{once:true});
})();
