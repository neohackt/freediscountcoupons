import type { Coupon } from '@/types';

/**
 * Determine which coupons in a listing should display the "Highest Discount" badge.
 *
 * Eligible set: unverified, non-expired (active) coupons in the same listing.
 * Comparison rules:
 *   - All percentage: highest numeric percentage wins (ties all win).
 *   - All fixed with same normalized currency: highest amount wins (ties all win).
 *   - Mixed types, different currencies, or non-comparable types: no badge.
 *   - Invalid discount values (missing, zero, negative, NaN, infinite, non-number)
 *     are excluded from comparison and never receive the badge.
 *   - A single valid eligible coupon is trivially the highest.
 */
export function computeHighestDiscountIds(coupons: Coupon[]): Set<string> {
  const result = new Set<string>();

  // Eligible: unverified + non-expired (reuse existing active classification)
  const eligible = coupons.filter(c => !c.verified && !c.is_expired);
  if (eligible.length === 0) return result;

  function isValidValue(v: unknown): v is number {
    return typeof v === 'number' && Number.isFinite(v) && v > 0;
  }

  function normalizeCurrency(v: unknown): string | null {
    if (typeof v !== 'string') return null;
    const trimmed = v.trim();
    if (trimmed === '') return null;
    return trimmed.toUpperCase();
  }

  const types = new Set(eligible.map(c => c.discount_type));

  const isPercentage = types.size === 1 && types.has('percentage');
  const currencies = new Set(eligible.map(c => normalizeCurrency(c.currency)));
  const isFixedSameCurrency =
    types.size === 1 && types.has('fixed') && currencies.size === 1 && !currencies.has(null);

  // Only comparable types can produce a "Highest Discount"
  let comparable = false;
  if (isPercentage) {
    comparable = eligible.every(c => isValidValue(c.discount_value));
  } else if (isFixedSameCurrency) {
    comparable = eligible.every(c => isValidValue(c.discount_value));
  }

  if (!comparable) return result;

  const maxVal = Math.max(...eligible.map(c => c.discount_value as number));
  for (const c of eligible) {
    if (c.discount_value === maxVal) result.add(String(c.id));
  }
  return result;
}