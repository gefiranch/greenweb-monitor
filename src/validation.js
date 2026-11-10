import ipaddr from 'ipaddr.js';
import { AppError } from './errors.js';

export function validateUrl(input) {
  const invalid = (message) => { throw new AppError('INVALID_URL', message, 400); };
  if (typeof input !== 'string' || !input.trim() || input.length > 2048) {
    invalid('Enter a public HTTP or HTTPS URL, up to 2,048 characters.');
  }
  if (/[\u0000-\u0020\u007f\\]/.test(input.trim())) invalid('Remove spaces or invalid characters from the URL.');
  let url;
  try { url = new URL(input.trim()); } catch { invalid('Enter a full URL, such as https://example.com.'); }
  if (!['http:', 'https:'].includes(url.protocol)) invalid('Only HTTP and HTTPS websites are supported.');
  if (url.username || url.password) invalid('URLs containing sign-in credentials are not supported.');
  if (url.port && !['80', '443'].includes(url.port)) invalid('Use a public website on the standard HTTP or HTTPS port.');
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (ipaddr.isValid(host)) {
    const address = ipaddr.process(host);
    if (address.range() !== 'unicast') invalid('Local, private, reserved, and internal addresses are not supported.');
  } else {
    const reserved = /(^|\.)(localhost|local|internal|lan|home|home\.arpa|test|invalid|example|onion|corp|intranet)$/;
    if (!host.includes('.') || reserved.test(host) || !/^[a-z0-9.-]+$/.test(host)
      || host.length > 253 || host.split('.').some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
      invalid('Enter a public website. Local and internal hostnames are not supported.');
    }
  }
  url.hash = '';
  return url.href;
}
