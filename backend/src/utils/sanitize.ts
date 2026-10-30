/**
 * Shared sanitization utilities for public API responses.
 *
 * Removes paid-traffic configuration fields from Store entities so they are
 * never exposed through public API endpoints. The protected
 * `paidTrafficConfig` endpoint constructs its response manually and does
 * NOT call these helpers.
 */

const PAID_TRAFFIC_FIELDS = [
  'paid_traffic_enabled',
  'paid_traffic_tracking_url',
  'paid_traffic_sources',
] as const;

/**
 * Remove paid-traffic configuration fields from a Store entity (or nested
 * store objects within coupons, events, categories, etc.). Mutates in place.
 *
 * Safe to call on null, undefined, primitives, empty objects, and objects
 * that have already been sanitized (idempotent). Recursion is limited to
 * plain objects and arrays to avoid modifying dates, buffers, or other
 * non-plain values.
 */
export function stripPaidTrafficFields(entity: unknown): void {
  if (entity === null || entity === undefined) return;
  if (typeof entity !== 'object') return;

  // Guard against non-plain objects (Date, Buffer, RegExp, etc.)
  const proto = Object.getPrototypeOf(entity);
  if (proto !== Object.prototype && proto !== Array.prototype && proto !== null) return;

  if (Array.isArray(entity)) {
    for (let i = 0; i < entity.length; i++) {
      stripPaidTrafficFields(entity[i]);
    }
    return;
  }

  const obj = entity as Record<string, unknown>;

  // Strip the three paid-traffic fields if present
  for (const field of PAID_TRAFFIC_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      delete obj[field];
    }
  }

  // Recurse into nested objects/arrays
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== null && typeof value === 'object') {
      stripPaidTrafficFields(value);
    }
  }
}
