import { analyzePageSpeed } from '../src/pagespeed.js';
import { estimateCarbon } from '../src/carbon.js';
import { validateUrl } from '../src/validation.js';
const url = validateUrl(process.argv[2] || 'https://example.com/');
try {
  const result = await analyzePageSpeed(url, { apiKey: process.env.PAGESPEED_API_KEY || '' });
  console.info(JSON.stringify({ ...result, estimatedCO2eGrams: estimateCarbon(result.transferBytes), carbonModel: 'SWDM v4' }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ code: error.code || 'LIVE_CHECK_FAILED', message: error.message }));
  process.exitCode = 1;
}
