'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HolyCouponCard } from './HolyCouponCard';
import { STRAPI_URL } from '@/lib/strapi';
import type { Coupon } from '@/types';

export interface CountryMarket {
  code: string;
  name: string;
  flag: string;
  couponCount: number;
}

interface StoreCountryCouponsProps {
  storeSlug: string;
  storeName: string;
  markets: CountryMarket[];
  initialVerified: Coupon[];
  initialRegular: Coupon[];
  initialExpired: Coupon[];
}

const PAGE_SIZE = 100;

// Same card projection as the Store page server rendering:
// plain serializable coupon with a trimmed store object.
function projectCouponForCard(coupon: Coupon) {
  return {
    ...coupon,
    store: coupon.store
      ? {
          id: coupon.store.id,
          slug: coupon.store.slug,
          name: coupon.store.name,
          website_url: coupon.store.website_url,
          affiliate_url: coupon.store.affiliate_url,
          currency: coupon.store.currency,
          country: coupon.store.country,
        }
      : null,
  };
}

interface CouponListResponse {
  data?: unknown;
  meta?: {
    pagination?: {
      total?: unknown;
    };
  };
}

// Fetch every page for a store + country combination so large stores are
// never silently truncated at the API page size.
async function fetchCountryCoupons(
  storeSlug: string,
  country: string,
  signal: AbortSignal
): Promise<Coupon[]> {
  const all: Coupon[] = [];
  let page = 1;
  let total: number | null = null;

  for (;;) {
    const url =
      `${STRAPI_URL}/api/coupons?filters[store][slug][$eq]=${encodeURIComponent(storeSlug)}` +
      `&country=${encodeURIComponent(country)}&pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Coupon request failed (${res.status})`);
    }
    const body = (await res.json()) as CouponListResponse;
    const rows: Coupon[] = Array.isArray(body.data) ? (body.data as Coupon[]) : [];
    all.push(...rows);
    if (total === null) {
      const t = body.meta?.pagination?.total;
      total = typeof t === 'number' ? t : rows.length;
    }
    if (all.length >= (total ?? 0) || rows.length === 0) break;
    page += 1;
  }

  return all;
}

const SELECTOR_BASE_CLASSES =
  'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1';
const SELECTOR_SELECTED_CLASSES = 'bg-blue-600 text-white border-blue-600';
const SELECTOR_UNSELECTED_CLASSES =
  'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600';

// Read the country selection from the URL hash (case-insensitive).
// Returns the market code, or null for missing/invalid hashes (→ All).
// Client-only: call exclusively from effects and event handlers.
function parseHashCountry(markets: CountryMarket[]): string | null {
  const raw = window.location.hash.replace(/^#/, '').trim().toUpperCase();
  if (!raw) return null;
  return markets.some((m) => m.code === raw) ? raw : null;
}

// Reflect a selection in the URL hash via pushState (one history entry per
// user selection, pathname and query preserved, no reload, no preflight).
// Skips the write when the hash already matches to avoid duplicate entries.
function writeHash(code: string) {
  const current = window.location.hash.replace(/^#/, '').toUpperCase();
  const next = code === 'ALL' ? '' : code.toUpperCase();
  if (current === next) return;
  const url = new URL(window.location.href);
  url.hash = next;
  window.history.pushState(null, '', url.toString());
}

export function StoreCountryCoupons({
  storeSlug,
  storeName,
  markets,
  initialVerified,
  initialRegular,
  initialExpired,
}: StoreCountryCouponsProps) {
  const [selected, setSelected] = useState<string>('ALL');
  const [fetched, setFetched] = useState<Coupon[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Mirror of `selected` for use inside listeners (avoids stale closures).
  // Every selection change flows through loadCountry below.
  const selectedRef = useRef<string>('ALL');

  // Preserve the Store page's coupon ordering: the country-filtered set is a
  // subset of the initial list, so re-sort fetched coupons by their position
  // in the initial server-rendered order.
  const orderMap = useMemo(() => {
    const map = new Map<string, number>();
    [...initialVerified, ...initialRegular, ...initialExpired].forEach((c, i) => {
      const key = c.documentId ?? String(c.id);
      if (!map.has(key)) map.set(key, i);
    });
    return map;
  }, [initialVerified, initialRegular, initialExpired]);

  // Core selection flow. `push` controls URL writes: user clicks push a
  // history entry; hash-sync paths (mount, popstate, hashchange) never write,
  // which makes feedback loops impossible (pushState fires no events).
  const loadCountry = useCallback(
    async (code: string, push: boolean) => {
      abortRef.current?.abort();
      if (code === 'ALL') {
        selectedRef.current = 'ALL';
        setSelected('ALL');
        setFetched(null);
        setError(null);
        setLoading(false);
        if (push) writeHash('ALL');
        return;
      }
      const seq = ++seqRef.current;
      const controller = new AbortController();
      abortRef.current = controller;
      selectedRef.current = code;
      setSelected(code);
      setError(null);
      setLoading(true);
      if (push) writeHash(code);
      try {
        const rows = await fetchCountryCoupons(storeSlug, code, controller.signal);
        if (seqRef.current !== seq) return;
        const projected = rows.map(projectCouponForCard);
        projected.sort((a, b) => {
          const ai = orderMap.get(a.documentId ?? String(a.id)) ?? Number.MAX_SAFE_INTEGER;
          const bi = orderMap.get(b.documentId ?? String(b.id)) ?? Number.MAX_SAFE_INTEGER;
          return ai - bi;
        });
        setFetched(projected as Coupon[]);
      } catch (err) {
        if (controller.signal.aborted || seqRef.current !== seq) return;
        setError(err instanceof Error ? err.message : 'Failed to load coupons');
      } finally {
        if (seqRef.current === seq) setLoading(false);
      }
    },
    [storeSlug, orderMap]
  );

  const selectCountry = useCallback(
    (code: string) => loadCountry(code, true),
    [loadCountry]
  );

  // Reconcile an existing hash once after hydration. Server and first client
  // render both stay ALL (no hydration mismatch); this effect performs zero
  // history writes.
  const marketsRef = useRef(markets);
  marketsRef.current = markets;
  useEffect(() => {
    const code = parseHashCountry(marketsRef.current);
    if (code && code !== selectedRef.current) {
      void loadCountry(code, false);
    }
    // Mount-only reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/Forward (popstate) and outside hash edits (hashchange) update the
  // selection without reloads and without writing history.
  useEffect(() => {
    const syncFromHash = () => {
      const code = parseHashCountry(marketsRef.current);
      const next = code ?? 'ALL';
      if (next !== selectedRef.current) {
        void loadCountry(next, false);
      }
    };
    window.addEventListener('popstate', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('popstate', syncFromHash);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [loadCountry]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const isFiltered = selected !== 'ALL' && fetched !== null;
  const source: Coupon[] = isFiltered && fetched
    ? fetched
    : [...initialVerified, ...initialRegular, ...initialExpired];
  const verified = source.filter((c: Coupon) => !c.is_expired && c.verified);
  const regular = source.filter((c: Coupon) => !c.is_expired && !c.verified);
  const expired = source.filter((c: Coupon) => c.is_expired);
  const selectedMarket = markets.find((m) => m.code === selected);
  const allEmpty = verified.length === 0 && regular.length === 0 && expired.length === 0;

  const selector = (
    <div className="mb-6" role="group" aria-label={`Filter ${storeName} coupons by country`}>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => selectCountry('ALL')}
          aria-pressed={selected === 'ALL'}
          aria-label={`Show all ${storeName} coupons`}
          className={`${SELECTOR_BASE_CLASSES} ${selected === 'ALL' ? SELECTOR_SELECTED_CLASSES : SELECTOR_UNSELECTED_CLASSES}`}
        >
          <span aria-hidden="true">🌎</span> All
        </button>
        {markets.map((m) => (
          <button
            key={m.code}
            type="button"
            onClick={() => selectCountry(m.code)}
            aria-pressed={selected === m.code}
            aria-label={`Show ${m.name} coupons`}
            title={m.name}
            className={`${SELECTOR_BASE_CLASSES} ${selected === m.code ? SELECTOR_SELECTED_CLASSES : SELECTOR_UNSELECTED_CLASSES}`}
          >
            <span aria-hidden="true">{m.flag}</span> {m.code}
          </button>
        ))}
      </div>
    </div>
  );

  const loadingSkeleton = (
    <div className="space-y-4" aria-live="polite" aria-label="Loading coupons">
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
    </div>
  );

  const errorBox = (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3" role="alert">
      <p className="text-sm text-red-700 flex-1">
        Could not load coupons{selectedMarket ? ` for ${selectedMarket.name}` : ''}. Please try again.
      </p>
      <button
        type="button"
        onClick={() => selectCountry(selected)}
        className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
      >
        Retry
      </button>
    </div>
  );

  const emptyBox = allEmpty && (
    selected !== 'ALL' && selectedMarket ? (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-500">No coupons available for {selectedMarket.name} right now.</p>
      </div>
    ) : (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
        <p className="text-gray-500 mb-2">No coupons available for this store yet.</p>
        <p className="text-gray-400 text-sm">Check back soon for new deals!</p>
      </div>
    )
  );

  return (
    <>
      {verified.length > 0 || loading || error ? (
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Top Verified
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Verified {storeName} Coupons
            </h2>
          </div>

          {selector}

          {loading ? (
            loadingSkeleton
          ) : error ? (
            errorBox
          ) : (
            <div className="space-y-4">
              {verified.map((coupon) => (
                <HolyCouponCard key={coupon.id} coupon={coupon as Coupon} />
              ))}
            </div>
          )}
        </section>
      ) : (
        selector
      )}

      {!loading && !error && regular.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              More {storeName} Coupon Codes
            </h2>
            <p className="text-gray-500">{regular.length} More Coupons</p>
          </div>

          <div className="space-y-4">
            {regular.map((coupon) => (
              <HolyCouponCard key={coupon.id} coupon={coupon as Coupon} />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && allEmpty && emptyBox}

      {!loading && !error && expired.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Expired Coupons
          </h2>

          <div className="space-y-4">
            {expired.map((coupon) => (
              <HolyCouponCard key={coupon.id} coupon={coupon as Coupon} isExpired />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
