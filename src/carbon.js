import { co2 } from '@tgwf/co2';
import { AppError } from './errors.js';

const model = new co2({ model: 'swd', version: 4 });
export const hostingAssumption = 'Green hosting has not been verified. The model uses non-green hosting (green = false); this does not establish the website’s actual energy source.';

export function estimateCarbon(transferBytes) {
  if (!Number.isSafeInteger(transferBytes) || transferBytes < 0) {
    throw new AppError('CARBON_CALCULATION_FAILED', 'The transfer size is not a valid number of bytes.', 502);
  }
  const grams = model.perVisit(transferBytes, false);
  if (!Number.isFinite(grams) || grams < 0) {
    throw new AppError('CARBON_CALCULATION_FAILED', 'The carbon estimate could not be calculated. Please try again.', 502);
  }
  return grams;
}
