const form = document.querySelector('#analyze-form');
const input = document.querySelector('#website-url');
const button = document.querySelector('#analyze-button');
const status = document.querySelector('#analysis-status');
const error = document.querySelector('#error-message');
const results = document.querySelector('#results');
let busy = false;
const text = (id, value) => { document.getElementById(id).textContent = value; };

function renderResults(data) {
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
    finding.textContent = `${item.finding} · Audit: ${item.id}`;
    li.append(heading, suggestion, finding);
    list.append(li);
  }
  text('recommendation-count', `${data.recommendations.length} findings`);
  document.getElementById('no-recommendations').hidden = data.recommendations.length > 0;
  results.hidden = false;
  results.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  error.hidden = true;
  input.removeAttribute('aria-invalid');
  const url = input.value.trim();
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || url.length > 2048) throw new Error();
  } catch {
    results.hidden = true;
    error.textContent = 'Enter a full public HTTP or HTTPS URL, such as https://example.com.';
    error.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }
  busy = true;
  button.disabled = true;
  input.readOnly = true;
  button.textContent = 'Analyzing…';
  form.setAttribute('aria-busy', 'true');
  status.hidden = false;
  results.hidden = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }), signal: controller.signal });
    let data;
    try { data = await response.json(); } catch { throw new Error('The server returned an unreadable response. Please try again.'); }
    if (!response.ok) {
      if (data.error?.code === 'INVALID_URL') input.setAttribute('aria-invalid', 'true');
      throw new Error(data.error?.message || 'The analysis could not be completed. Please try again.');
    }
    renderResults(data);
  } catch (failure) {
    error.textContent = controller.signal.aborted ? 'The request took too long. Please try again.' : failure instanceof TypeError ? 'Could not connect to the analyzer. Check your connection and try again.' : failure.message;
    error.hidden = false;
  } finally {
    clearTimeout(timer);
    busy = false;
    button.disabled = false;
    input.readOnly = false;
    button.textContent = 'Analyze page';
    status.hidden = true;
    form.removeAttribute('aria-busy');
  }
});
input.addEventListener('input', () => { input.removeAttribute('aria-invalid'); error.hidden = true; });
