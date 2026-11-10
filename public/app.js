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
const exampleButton = document.querySelector('#example-url');
const progress = document.querySelector('#audit-progress');
const cancelButton = document.querySelector('#cancel-analysis');
function updateField() {
  clearButton.hidden = !input.value || busy;
  exampleButton.disabled = busy;
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
    finding.textContent = item.finding;
    li.append(heading, suggestion, finding);
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
exampleButton.addEventListener('click', () => {
  if (busy) return;
  input.value = 'https://example.com'; input.removeAttribute('aria-invalid');
  error.hidden = true; progress.hidden = true; status.hidden = true;
  updateField(); input.focus();
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
  let previous = 0, angle = -.3, speed = .14, phase = 0, width = 0, height = 0;
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
    const radius = Math.min(width * .55, height * 1.04);
    const cx=width/2, cy=height*1.1, co=Math.cos(angle), si=Math.sin(angle);
    function project(p) {
      const x=p[0]*co+p[2]*si, z=p[2]*co-p[0]*si;
      const y=p[1]*.966-z*.259, depth=p[1]*.259+z*.966;
      return [cx+x*radius,cy+y*radius,depth];
    }
    ctx.clearRect(0,0,width,height);
    const halo=ctx.createRadialGradient(cx,cy, radius*.6,cx,cy,radius*1.45);
    halo.addColorStop(0,'rgba(111,152,213,.14)');halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    const sphere=ctx.createRadialGradient(cx-radius*.3,cy-radius*.5,0,cx,cy,radius);
    sphere.addColorStop(0,'#19243a');sphere.addColorStop(.65,'#080e18');sphere.addColorStop(1,'#020407');
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fillStyle=sphere;ctx.fill();
    ctx.strokeStyle='rgba(168,196,236,.24)';ctx.lineWidth=.8;ctx.stroke();
    function line(points, color, thickness) {
      ctx.beginPath();let pen=false;
      for(const p of points) {
        const [x,y,z]=project(p);
        if(z<.02){pen=false;continue;}
        if(pen)ctx.lineTo(x,y);else ctx.moveTo(x,y);
        pen=true;
      }
      ctx.strokeStyle=color;ctx.lineWidth=thickness;ctx.stroke();
    }
    for(const g of grid)line(g,'rgba(152,180,222,.11)',.65);
    const interactive = hoverAmount > .001;
    const pulse = interactive ? .85 + Math.sin(phase * 2) * .15 : 0;
    for(const d of dots) {
      let [x,y,z]=project(d);if(z<0||y>height+12)continue;
      let influence=0;
      if (interactive) {
        const dx=x-pointerX, dy=y-pointerY;
        const falloff=Math.max(0,1-(dx*dx+dy*dy)/22500);
        influence=hoverAmount*falloff*falloff*pulse;
        x+=dx/150*influence*5;
        y+=dy/150*influence*5;
      }
      const size=.6+z*.55+influence*.75;
      ctx.beginPath();ctx.arc(x,y,size,0,Math.PI*2);
      ctx.fillStyle=`rgba(184,209,247,${Math.min(1,.25+z*.56+influence*.45)})`;ctx.fill();
    }
    routes.forEach((route,i)=>{
      line(route,'rgba(163,197,246,.42)',.8);
      const t=(phase*.16+i*.137)%1, idx=t*40, a=Math.floor(idx), f=idx-a;
      const p=route[a].map((n,k)=>n+(route[Math.min(a+1,40)][k]-n)*f);
      const [x,y,z]=project(p);if(z<.02)return;
      ctx.beginPath();ctx.arc(x,y,2.1,0,Math.PI*2);ctx.fillStyle='#e0ecff';ctx.fill();
      ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle='rgba(171,197,239,.1)';ctx.fill();
    });
    for(const h of hubs){const [x,y,z]=project(h);if(z<.05)continue;
      ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#b8d2f7';ctx.fill();
      ctx.beginPath();ctx.arc(x,y,6.5,0,Math.PI*2);ctx.strokeStyle='rgba(184,210,247,.25)';ctx.lineWidth=1;ctx.stroke();
    }
  }

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (!previous) { previous=now; return; }
    const elapsed = now-previous;
    if (elapsed < 1000/30) return;
    const dt=Math.min(elapsed/1000,.08); previous=now;
    speed += ((hovered ? .38 : .14)-speed)*(1-Math.exp(-dt*2.5));
    angle=(angle+speed*dt)%(Math.PI*2);phase+=dt;
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
