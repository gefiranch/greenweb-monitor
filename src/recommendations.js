const rules = [
  ['unused-javascript', 'Remove unused JavaScript', 'Split scripts by page and remove code that this page does not use.', 'scripts'],
  ['unused-css-rules', 'Remove unused CSS', 'Remove unused styles and load only the CSS needed by this page.', 'styles'],
  ['modern-image-formats', 'Use efficient image formats', 'Use AVIF or WebP where supported and keep a suitable fallback.', 'images'],
  ['uses-optimized-images', 'Compress images', 'Compress images without reducing their necessary visual quality.', 'images'],
  ['uses-responsive-images', 'Resize images for the screen', 'Serve images sized for the space and device that display them.', 'images'],
  ['image-delivery-insight', 'Improve image delivery', 'Resize and compress images, and use an efficient format where appropriate.', 'images'],
  ['render-blocking-resources', 'Reduce render-blocking resources', 'Defer nonessential scripts and load critical styles first.', 'loading'],
  ['render-blocking-insight', 'Reduce render-blocking resources', 'Defer nonessential scripts and load critical styles first.', 'loading'],
  ['uses-text-compression', 'Compress text resources', 'Enable Brotli or gzip for HTML, CSS, and JavaScript.', 'compression'],
  ['unminified-javascript', 'Minify JavaScript', 'Serve minified production scripts to reduce transfer size.', 'minify-js'],
  ['unminified-css', 'Minify CSS', 'Serve minified stylesheets to reduce transfer size.', 'minify-css'],
  ['total-byte-weight', 'Reduce the page payload', 'Review large images, scripts, and media to reduce total data transferred.', 'payload'],
];

// App-specific impact bands, not Lighthouse scoring thresholds.
function estimate(values) {
  const valid = values.filter(value => Number.isFinite(value) && value >= 0);
  return valid.length ? Math.max(...valid) : null;
}
function impactFor(bytes, ms) {
  if (bytes === null && ms === null) return 'unknown';
  if (bytes >= 100 * 1024 || ms >= 500) return 'high';
  if (bytes >= 20 * 1024 || ms >= 100) return 'medium';
  return 'low';
}
function collectChecks(audits = {}) {
  const findings = [];
  for (const [id, title, suggestion, group] of rules) {
    const audit = audits[id];
    if (!audit || !Number.isFinite(audit.score) || audit.score < 0 || audit.score > 1
      || ['error', 'notApplicable', 'not_applicable', 'manual'].includes(audit.scoreDisplayMode)) continue;
    const savingsBytes = estimate([audit.details?.overallSavingsBytes, audit.metricSavings?.totalBytes]);
    const savingsMs = estimate([audit.details?.overallSavingsMs, audit.metricSavings?.FCP, audit.metricSavings?.LCP]);
    const evidence = [];
    if (savingsMs !== null) evidence.push(`${Math.round(savingsMs)} ms`);
    if (savingsBytes !== null) evidence.push(`${(savingsBytes / 1024).toFixed(1)} KiB`);
    findings.push({ id, title, suggestion, group, score: audit.score,
      finding: typeof audit.displayValue === 'string' ? audit.displayValue.slice(0, 250) : 'Lighthouse identified an opportunity in this audit.',
      savingsBytes, savingsMs, priority: impactFor(savingsBytes, savingsMs),
      impactEvidence: evidence.length ? `Estimated savings: ${evidence.join(' · ')}` : 'This audit did not provide a numeric savings estimate.' });
  }
  return findings;
}
function uniqueGroups(findings) {
  const groups = new Set();
  return findings.filter(item => {
    if (groups.has(item.group)) return false;
    groups.add(item.group);
    return true;
  });
}
export function getRecommendations(audits = {}) {
  const ranks = { high: 0, medium: 1, low: 2, unknown: 3 };
  const findings = collectChecks(audits).filter(item => item.score < 1);
  const weight = item => Math.max((item.savingsMs ?? 0) / 500, (item.savingsBytes ?? 0) / (100 * 1024));
  findings.sort((a, b) => ranks[a.priority] - ranks[b.priority] || weight(b) - weight(a) || a.score - b.score);
  return uniqueGroups(findings).slice(0, 5).map(({ group, score, ...item }) => item);
}
// Retained API field for compatibility; passing checks are not improvement impacts.
const passedLabels = {
  scripts: 'Unused JavaScript', styles: 'Unused CSS', images: 'Image delivery',
  loading: 'Render-blocking resources', compression: 'Text compression',
  'minify-js': 'JavaScript minification', 'minify-css': 'CSS minification', payload: 'Page payload',
};
export function getPassedChecks(audits = {}) {
  const checks = collectChecks(audits);
  const failedGroups = new Set(checks.filter(item => item.score < 1).map(item => item.group));
  return uniqueGroups(checks.filter(item => item.score === 1 && !failedGroups.has(item.group)))
    .map(({ id, group }) => ({ id, title: passedLabels[group] }));
}
