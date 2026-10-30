/**
 * Generic paid-traffic (Offer18) resolution helpers.
 *
 * This module is intentionally dependency free and framework free so it can
 * be unit tested in isolation. It never reads or accepts a destination from
 * an incoming query parameter: the destination is always derived from the
 * tracking URL template configured on the Store record in Strapi.
 */

/** The single generic paid-traffic source value supported site-wide. */
export const PAID_TRAFFIC_SOURCE = 'paid';

/** Query parameter names used by the Offer18 landing URL. */
export const PAID_TRAFFIC_PARAMS = {
  source: 'fdc_source',
  tid: 'fdc_tid',
  affid: 'fdc_affid',
  offerid: 'fdc_offerid',
  affSub2: 'fdc_aff_sub2',
} as const;

/**
 * Macros supported inside a brand tracking URL template.
 * Verified against the Offer18 tracking URL macro documentation
 * (https://knowledgebase.offer18.com/network/offers/tracking-url-macros):
 *   {tid}      - Offer18 platform click id
 *   {aff_id}   - Offer18 affiliate id
 *   {offerid}  - Offer18 offer id
 *   {aff_sub2} - Offer18 affiliate sub-id 2 (forwarded zone/click value)
 * No other macro is ever substituted.
 */
export const PAID_TRAFFIC_MACRO_TID = '{tid}';
export const PAID_TRAFFIC_MACRO_AFF_ID = '{aff_id}';
export const PAID_TRAFFIC_MACRO_OFFER_ID = '{offerid}';
export const PAID_TRAFFIC_MACRO_AFF_SUB2 = '{aff_sub2}';

export interface PaidTrafficConfig {
  name: string;
  slug: string;
  paid_traffic_enabled: boolean;
  paid_traffic_sources: string[];
  paid_traffic_tracking_url: string | null;
}

export interface PaidTrafficParams {
  source: string | null;
  tid: string | null;
  affid: string | null;
  offerid: string | null;
  affSub2?: string | null;
}

export type PaidTrafficFailureReason =
  | 'not-paid-source'
  | 'store-not-found'
  | 'disabled'
  | 'source-not-allowed'
  | 'missing-template'
  | 'missing-tid'
  | 'missing-affid'
  | 'missing-offerid'
  | 'missing-aff-sub2'
  | 'invalid-template'
  | 'unresolved-macro'
  | 'insecure-destination';

export type PaidTrafficResolution =
  | { ok: true; destination: string }
  | { ok: false; reason: PaidTrafficFailureReason };

type QueryValue = string | string[] | undefined;

function firstValue(value: QueryValue): string | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : null;
  }
  return typeof value === 'string' ? value : null;
}

/**
 * Read the paid-traffic parameters from a query object.
 * Unknown parameters are ignored; nothing else is read.
 */
export function readPaidTrafficParams(query: Record<string, QueryValue> | null | undefined): PaidTrafficParams {
  const source = query?.[PAID_TRAFFIC_PARAMS.source];
  const tid = query?.[PAID_TRAFFIC_PARAMS.tid];
  const affid = query?.[PAID_TRAFFIC_PARAMS.affid];
  const offerid = query?.[PAID_TRAFFIC_PARAMS.offerid];
  const affSub2 = query?.[PAID_TRAFFIC_PARAMS.affSub2];

  return {
    source: firstValue(source),
    tid: firstValue(tid),
    affid: firstValue(affid),
    offerid: firstValue(offerid),
    affSub2: firstValue(affSub2),
  };
}

/**
 * Only the exact generic value "paid" is treated as paid traffic.
 * Network specific values such as "pop", "push" or "domain" are not.
 */
export function isPaidTrafficSource(source: string | null | undefined): boolean {
  if (typeof source !== 'string') return false;
  // Exact match only — no trimming, no case folding. "paid" is the single
  // generic value; " paid ", "PAID", etc. must not trigger paid routing.
  return source === PAID_TRAFFIC_SOURCE;
}

/** Clean store path used as the referrer for the brand tracking request. */
export function buildPaidTrafficStorePath(slug: string): string {
  return `/store/${encodeURIComponent(slug)}`;
}

/**
 * Percent-encode a value for safe insertion into a URL.
 * Uses RFC 3986 unreserved-set rules so the result is valid in both the
 * query string and the path.
 */
function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/**
 * Resolve the brand tracking destination from a configured template.
 *
 * - Only {tid}, {aff_id} and {offerid} are substituted.
 * - A macro that is present in the template requires its value.
 * - Static URL parts and parameters are preserved.
 * - Unresolved macros, invalid URLs and non-HTTPS destinations are rejected.
 */
export function resolvePaidTrafficDestination(input: {
  template: string | null | undefined;
  tid?: string | null;
  affid?: string | null;
  offerid?: string | null;
  affSub2?: string | null;
}): PaidTrafficResolution {
  const template = typeof input.template === 'string' ? input.template.trim() : '';

  if (!template) {
    return { ok: false, reason: 'missing-template' };
  }

  const macros: Array<[string, string | null | undefined, PaidTrafficFailureReason]> = [
    [PAID_TRAFFIC_MACRO_TID, input.tid, 'missing-tid'],
    [PAID_TRAFFIC_MACRO_AFF_ID, input.affid, 'missing-affid'],
    [PAID_TRAFFIC_MACRO_OFFER_ID, input.offerid, 'missing-offerid'],
    [PAID_TRAFFIC_MACRO_AFF_SUB2, input.affSub2, 'missing-aff-sub2'],
  ];

  let resolved = template;

  for (const [macro, value, reason] of macros) {
    if (!resolved.includes(macro)) continue;

    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) {
      return { ok: false, reason };
    }

    resolved = resolved.split(macro).join(encodeValue(raw));
  }

  // Any brace left over is an unsupported or unresolved macro. It must never
  // reach the tracking network.
  if (resolved.includes('{') || resolved.includes('}')) {
    return { ok: false, reason: 'unresolved-macro' };
  }

  let url: URL;
  try {
    url = new URL(resolved);
  } catch {
    return { ok: false, reason: 'invalid-template' };
  }

  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'insecure-destination' };
  }

  if (url.href.includes('{') || url.href.includes('}')) {
    return { ok: false, reason: 'unresolved-macro' };
  }

  return { ok: true, destination: url.href };
}

/**
 * Full decision for one incoming request against one store configuration.
 */
export function evaluatePaidTraffic(input: {
  config: PaidTrafficConfig | null | undefined;
  params: PaidTrafficParams;
}): PaidTrafficResolution {
  const { config, params } = input;

  // Only the exact generic source value is handled here. Network specific
  // values such as "pop", "push" or "domain" never reach the paid route.
  if (!isPaidTrafficSource(params.source)) {
    return { ok: false, reason: 'not-paid-source' };
  }

  if (!config) {
    return { ok: false, reason: 'store-not-found' };
  }

  if (config.paid_traffic_enabled !== true) {
    return { ok: false, reason: 'disabled' };
  }

  const allowed = Array.isArray(config.paid_traffic_sources) ? config.paid_traffic_sources : [];
  if (!allowed.includes(PAID_TRAFFIC_SOURCE)) {
    return { ok: false, reason: 'source-not-allowed' };
  }

  return resolvePaidTrafficDestination({
    template: config.paid_traffic_tracking_url,
    tid: params.tid,
    affid: params.affid,
    offerid: params.offerid,
    affSub2: params.affSub2,
  });
}
