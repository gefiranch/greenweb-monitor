import { analyzePageSpeed } from '../src/pagespeed.js';
import { estimateCarbon } from '../src/carbon.js';
import { validateUrl } from '../src/validation.js';
if (!process.argv[2]) { console.error('Usage: npm run evaluate -- https://your-public-app.example'); process.exit(1); }
const url = validateUrl(process.argv[2]);
try {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    console.info(`Running explicit evaluation ${i + 1}/3 (mobile, performance).`);
    runs.push(await analyzePageSpeed(url, { apiKey: process.env.PAGESPEED_API_KEY || '' }));
  }
  const medianTransferBytes = runs.map(run => run.transferBytes).sort((a, b) => a - b)[1];
  console.info(JSON.stringify({ url, runs, medianTransferBytes, estimatedCO2eGrams: estimateCarbon(medianTransferBytes), carbonModel: 'SWDM v4', hostingVerified: false }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ code: error.code || 'EVALUATION_FAILED', message: error.message }));
  process.exitCode = 1;
}
