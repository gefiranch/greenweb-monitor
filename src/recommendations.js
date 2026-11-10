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

function collectChecks(audits = {}) {
  const findings = [];
  for (const [id, title, suggestion, group] of rules) {
    const audit = audits[id];
    if (!audit || !Number.isFinite(audit.score) || audit.score < 0 || audit.score > 1
      || ['error', 'notApplicable', 'not_applicable', 'manual'].includes(audit.scoreDisplayMode)) continue;
    const bytes = audit.details?.overallSavingsBytes ?? audit.metricSavings?.totalBytes ?? 0;
    const ms = audit.details?.overallSavingsMs ?? audit.metricSavings?.FCP ?? audit.metricSavings?.LCP ?? 0;
    findings.push({ id, title, suggestion, group, score: audit.score,
      finding: typeof audit.displayValue === 'string' ? audit.displayValue.slice(0, 250) : 'Lighthouse identified an opportunity in this audit.',
      savingsBytes: Number.isFinite(bytes) && bytes > 0 ? bytes : 0,
      savingsMs: Number.isFinite(ms) && ms > 0 ? ms : 0 });
  }
  findings.sort((a, b) => (a.score - b.score) || (b.savingsBytes - a.savingsBytes) || (b.savingsMs - a.savingsMs));
  const groups = new Set();
  return findings.filter(item => {
    if (groups.has(item.group)) return false;
    groups.add(item.group);
    return true;
  });
}

// These priorities describe individual supported audits, not the page's overall score.
export function getRecommendations(audits = {}) {
  return collectChecks(audits).filter(item => item.score < .9).slice(0, 5)
    .map(({ group, score, ...item }) => ({ ...item, priority: score < .5 ? 'high' : 'medium' }));
}

const passedLabels = {
  scripts: 'Unused JavaScript', styles: 'Unused CSS', images: 'Image delivery',
  loading: 'Render-blocking resources', compression: 'Text compression',
  'minify-js': 'JavaScript minification', 'minify-css': 'CSS minification', payload: 'Page payload',
};
export function getPassedChecks(audits = {}) {
  return collectChecks(audits).filter(item => item.score >= .9)
    .map(({ id, group }) => ({ id, title: passedLabels[group] }));
}
