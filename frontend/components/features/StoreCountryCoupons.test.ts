import {
  fetchCountryCoupons,
  fetchGlobalCoupons,
  parseHashCountry,
  isTargetedTo,
} from './StoreCountryCoupons';

let failures = 0;

// Mock window.location for hash parsing tests (Node.js has no window).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).window = {
  location: { hash: '' },
};

function check(actual: unknown, expected: unknown, description: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  const pass = a === e;
  if (!pass) failures++;
  console.log(`${pass ? '✓' : '✗'} ${description}`);
  if (!pass) {
    console.log(`  Expected: ${e}`);
    console.log(`  Actual:   ${a}`);
  }
}

// Minimal window.location mock for hash parsing tests.
function withHash(hash: string, fn: () => void) {
  const originalHash = (window as any).location.hash;
  (window as any).location.hash = hash;
  try {
    fn();
  } finally {
    (window as any).location.hash = originalHash;
  }
}

async function testFetchCountryCouponsUrl() {
  console.log('\n--- fetchCountryCoupons URL construction ---');

  const capturedUrls: string[] = [];
  const originalFetch = globalThis.fetch;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = async (url: string) => {
    capturedUrls.push(String(url));
    return {
      ok: true,
      json: async () => ({ data: [], meta: { pagination: { total: 0 } } }),
    } as any;
  };

  try {
    await fetchCountryCoupons('aliexpress', 'JP', new AbortController().signal);
  } finally {
    (globalThis as any).fetch = originalFetch;
  }

  check(capturedUrls.length, 1, 'fetchCountryCoupons makes one request');
  const url = capturedUrls[0];
  check(url.includes('country=JP'), true, 'Country sends country=JP');
  check(url.includes('scope='), false, 'Country does not send scope parameter');
  check(url.includes('filters[store][slug][$eq]=aliexpress'), true, 'Store filter preserved');
  check(url.includes('pagination[page]=1'), true, 'Pagination preserved');
  check(url.includes('pagination[pageSize]=100'), true, 'Page size preserved');
}

async function testFetchGlobalCouponsUrl() {
  console.log('\n--- fetchGlobalCoupons URL construction ---');

  const capturedUrls: string[] = [];
  const originalFetch = globalThis.fetch;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = async (url: string) => {
    capturedUrls.push(String(url));
    return {
      ok: true,
      json: async () => ({ data: [], meta: { pagination: { total: 0 } } }),
    } as any;
  };

  try {
    await fetchGlobalCoupons('aliexpress', new AbortController().signal);
  } finally {
    (globalThis as any).fetch = originalFetch;
  }

  check(capturedUrls.length, 1, 'fetchGlobalCoupons makes one request');
  const url = capturedUrls[0];
  check(url.includes('scope=global'), true, 'Global sends scope=global');
  check(url.includes('country='), false, 'Global does not send country parameter');
  check(url.includes('filters[store][slug][$eq]=aliexpress'), true, 'Store filter preserved');
  check(url.includes('pagination[page]=1'), true, 'Pagination preserved');
}

async function testParseHashCountry() {
  console.log('\n--- parseHashCountry ---');

  const markets = [
    { code: 'JP', name: 'Japan', flag: '🇯🇵', couponCount: 5 },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', couponCount: 3 },
  ];

  withHash('', () => {
    check(parseHashCountry(markets), null, 'empty hash → null (All)');
  });

  withHash('#JP', () => {
    check(parseHashCountry(markets), 'JP', '#JP → JP');
  });

  withHash('#GLOBAL', () => {
    check(parseHashCountry(markets), 'GLOBAL', '#GLOBAL → GLOBAL');
  });

  withHash('#global', () => {
    check(parseHashCountry(markets), 'GLOBAL', '#global → GLOBAL (case-insensitive)');
  });

  withHash('#CL', () => {
    check(parseHashCountry(markets), 'CL', '#CL → CL');
  });

  withHash('#XX', () => {
    check(parseHashCountry(markets), null, '#XX → null (not a market)');
  });
}

async function testIsTargetedTo() {
  console.log('\n--- isTargetedTo ---');

  const globalCoupon = { countries: [] } as any;
  const jpCoupon = { countries: [{ code: 'JP' }] } as any;
  const clCoupon = { countries: [{ code: 'CL' }] } as any;
  const jpClCoupon = { countries: [{ code: 'JP' }, { code: 'CL' }] } as any;

  check(isTargetedTo(globalCoupon, 'JP'), false, 'Global coupon not targeted to JP');
  check(isTargetedTo(jpCoupon, 'JP'), true, 'JP coupon targeted to JP');
  check(isTargetedTo(jpCoupon, 'CL'), false, 'JP coupon not targeted to CL');
  check(isTargetedTo(jpClCoupon, 'JP'), true, 'JP+CL coupon targeted to JP');
  check(isTargetedTo(jpClCoupon, 'CL'), true, 'JP+CL coupon targeted to CL');
  check(isTargetedTo(clCoupon, 'JP'), false, 'CL coupon not targeted to JP');
}

async function main() {
  console.log('=== StoreCountryCoupons selector tests ===');
  await testFetchCountryCouponsUrl();
  await testFetchGlobalCouponsUrl();
  await testParseHashCountry();
  await testIsTargetedTo();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
