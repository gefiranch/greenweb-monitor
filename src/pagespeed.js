import { AppError } from './errors.js';
import { getRecommendations } from './recommendations.js';
import { validateUrl } from './validation.js';

export function normalizePageSpeed(data) {
  const result = data?.lighthouseResult;
  if (result?.runtimeError) throw new AppError('ANALYSIS_FAILED', 'Google could not analyze this page. Check that it is publicly accessible and try again.', 422);
  const score = result?.categories?.performance?.score;
  const payload = result?.audits?.['total-byte-weight'];
  const bytes = payload?.numericValue;
  const finalUrl = result?.finalDisplayedUrl || result?.finalUrl;
  const time = result?.fetchTime || data?.analysisUTCTimestamp;
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1
    || !Number.isSafeInteger(bytes) || bytes < 0 || payload?.numericUnit !== 'byte'
    || typeof finalUrl !== 'string' || typeof time !== 'string' || !Number.isFinite(Date.parse(time))) {
    throw new AppError('INCOMPLETE_RESPONSE', 'Google returned incomplete performance or transfer data. Please try again.', 502);
  }
  let url;
  try { url = validateUrl(finalUrl); } catch { throw new AppError('ANALYSIS_FAILED', 'The analyzed page resolved to an unsupported URL.', 422); }
  if (result.configSettings?.formFactor && result.configSettings.formFactor !== 'mobile') {
    throw new AppError('INCOMPLETE_RESPONSE', 'Google did not return a mobile analysis. Please try again.', 502);
  }
  return { url, analyzedAt: new Date(time).toISOString(), strategy: 'mobile', performanceScore: Math.round(score * 100),
    transferBytes: bytes, recommendations: getRecommendations(result.audits) };
}

export async function analyzePageSpeed(url, { apiKey = '', fetchImpl = fetch, timeoutMs = 55000 } = {}) {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.search = new URLSearchParams({ url, strategy: 'mobile', category: 'performance', locale: 'en' });
  if (apiKey) endpoint.searchParams.set('key', apiKey);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint.href, { signal: controller.signal, headers: { Accept: 'application/json' }, redirect: 'error' });
    if (!response.ok) {
      if (response.status === 429) throw new AppError('UPSTREAM_QUOTA_EXCEEDED', 'Google’s PageSpeed quota is currently exhausted. Try later; the operator can configure a PageSpeed API key with available quota.', 503);
      if ([400, 401, 403].includes(response.status)) {
        let details;
        try { details = await response.json(); } catch { /* Keep upstream details private. */ }
        const keyError = /key|credential|api.?key|accessNotConfigured|SERVICE_DISABLED/i.test(JSON.stringify(details?.error ?? {}));
        if (response.status !== 400 || keyError) throw new AppError('API_CONFIGURATION_ERROR', apiKey
          ? 'PageSpeed access was rejected. The operator should check the API key, API enablement, and quota.'
          : 'PageSpeed requires API access for this request. The operator should configure PAGESPEED_API_KEY.', 503);
        throw new AppError('ANALYSIS_FAILED', 'Google could not analyze this URL. Check that the page is public and try again.', 422);
      }
      throw new AppError('UPSTREAM_ERROR', 'Google PageSpeed Insights is temporarily unavailable. Please try again later.', 502);
    }
    let data;
    try { data = await response.json(); } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new AppError('INCOMPLETE_RESPONSE', 'Google returned an unreadable response. Please try again.', 502);
    }
    return normalizePageSpeed(data);
  } catch (error) {
    if (controller.signal.aborted) throw new AppError('API_TIMEOUT', 'The analysis took too long. Please try again.', 504);
    if (error instanceof AppError) throw error;
    throw new AppError('NETWORK_ERROR', 'Could not reach Google PageSpeed Insights. Please try again.', 502);
  } finally { clearTimeout(timer); }
}
