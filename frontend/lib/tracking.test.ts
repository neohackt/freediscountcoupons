import {
  getUrlParams,
  getStoredTracking,
  getTrackingValues,
  initializeTracking,
  applyTrackingToUrl,
  getTrackedCouponLink,
  getTrackedWebsiteUrl,
  type TrackingValues,
} from './tracking';

let failures = 0;

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

// Helper to mock document.cookie
function mockCookie(cookieString: string) {
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: cookieString,
  });
}

// Helper to mock window.location
function mockLocation(search: string) {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { search, href: `http://localhost:3000${search}` },
  });
}

// Reset mocks
function resetMocks() {
  if (typeof document !== 'undefined') {
    mockCookie('');
  }
  if (typeof window !== 'undefined') {
    mockLocation('');
  }
}

// === getUrlParams tests ===
console.log('\n--- getUrlParams ---');

const gp1 = getUrlParams(new URLSearchParams('gclid=GOOGLE123&keyword=shoes&src=googleads&acc=WZ2&camp=Shein_Search_India'));
check(gp1.gclid, 'GOOGLE123', 'GP1. gclid extracted');
check(gp1.keyword, 'shoes', 'GP2. keyword extracted');
check(gp1.src, 'googleads', 'GP3. src extracted');
check(gp1.camp, 'Shein_Search_India', 'GP4. camp extracted');
check(gp1.acc, 'WZ2', 'GP5. acc extracted');

const gp2 = getUrlParams(new URLSearchParams('msclkid=BING123&keyword=shoes&src=bingads&acc=BING1&camp=Shein%20Search'));
check(gp2.gclid, 'BING123', 'GP6. msclkid populates gclid');
check(gp2.keyword, 'shoes', 'GP7. keyword extracted (Bing)');
check(gp2.src, 'bingads', 'GP8. src extracted (Bing)');
check(gp2.camp, 'Shein Search', 'GP9. camp URL-decoded');
check(gp2.acc, 'BING1', 'GP10. acc extracted (Bing)');

const gp3 = getUrlParams(new URLSearchParams('gclid=GOOGLE123&msclkid=BING456'));
check(gp3.gclid, 'GOOGLE123', 'GP11. gclid takes precedence over msclkid');

const gp4 = getUrlParams(new URLSearchParams(''));
check(gp4, { gclid: '', keyword: '', src: '', camp: '', acc: '' }, 'GP12. empty params return all empty');

const gp5 = getUrlParams(new URLSearchParams('keyword=running+shoes'));
check(gp5.keyword, 'running shoes', 'GP13. keyword with + decoded');

// === getStoredTracking tests ===
console.log('\n--- getStoredTracking ---');

// Simulate SSR (no document)
const origDocument = global.document;
// @ts-ignore
delete global.document;
const st1 = getStoredTracking();
check(st1, { gclid: '', keyword: '', src: '', camp: '', acc: '' }, 'ST1. SSR returns all empty');
// @ts-ignore
global.document = origDocument;

// === applyTrackingToUrl tests ===
console.log('\n--- applyTrackingToUrl ---');

const TEMPLATE = 'https://click.freediscountcoupons.com/c?o=22016371&m=459&a=30610&aff_sub1={gclid}&aff_sub3={keyword}&aff_sub2={src}&aff_sub5={camp}&aff_sub6={acc}';

// Google full substitution
const at1 = applyTrackingToUrl(TEMPLATE, 'GOOGLE123', 'shoes', 'googleads', 'Shein_Search_India', 'WZ2');
check(at1.includes('aff_sub1=GOOGLE123'), true, 'AT1. gclid substituted');
check(at1.includes('aff_sub3=shoes'), true, 'AT2. keyword substituted');
check(at1.includes('aff_sub2=googleads'), true, 'AT3. src substituted');
check(at1.includes('aff_sub5=Shein_Search_India'), true, 'AT4. camp substituted');
check(at1.includes('aff_sub6=WZ2'), true, 'AT5. acc substituted');

// Bing full substitution with encoding
const at2 = applyTrackingToUrl(TEMPLATE, 'BING123', 'shoes', 'bingads', 'Shein Search', 'BING1');
check(at2.includes('aff_sub1=BING123'), true, 'AT6. Bing gclid substituted');
check(at2.includes('aff_sub3=shoes'), true, 'AT7. Bing keyword substituted');
check(at2.includes('aff_sub2=bingads'), true, 'AT8. Bing src substituted');
check(at2.includes('aff_sub5=Shein%20Search'), true, 'AT9. camp encoded exactly once');
check(at2.includes('aff_sub6=BING1'), true, 'AT10. Bing acc substituted');

// Backward compatibility (only gclid + keyword)
const at3 = applyTrackingToUrl('https://example.com/track?g={gclid}&k={keyword}&s={src}', 'G1', 'K1');
check(at3, 'https://example.com/track?g=G1&k=K1&s=', 'AT11. backward compat: missing src removed');

// Missing values remove macros
const at4 = applyTrackingToUrl('https://example.com/track?src={src}&camp={camp}&acc={acc}', '', '', '', '', '');
check(at4, 'https://example.com/track?src=&camp=&acc=', 'AT12. all empty: macros removed');

// Partial missing
const at5 = applyTrackingToUrl('https://example.com/track?src={src}&camp={camp}', 'G', 'K', 'google', '', '');
check(at5, 'https://example.com/track?src=google&camp=', 'AT13. partial: src substituted, camp removed');

// gclid/keyword preserved when missing (existing behavior)
const at6 = applyTrackingToUrl('https://example.com/track?g={gclid}&k={keyword}', '', '');
check(at6, 'https://example.com/track?g={gclid}&k={keyword}', 'AT14. gclid/keyword left unreplaced when empty');

// Special characters encoded once
const at7 = applyTrackingToUrl('https://example.com/track?s={src}', '', '', 'a b&c=d?e#f');
check(at7.includes('s=a%20b%26c%3Dd%3Fe%23f'), true, 'AT15. special chars encoded once');

// URL without new macros unchanged
const at8 = applyTrackingToUrl('https://example.com/track?g={gclid}', 'G1', '');
check(at8, 'https://example.com/track?g=G1', 'AT16. URL without new macros unchanged');

// Different stores retain IDs
const at9 = applyTrackingToUrl('https://click.freediscountcoupons.com/c?o=22034122&m=459&a=30610&aff_sub1={gclid}', 'G1', 'K1');
check(at9.includes('o=22034122'), true, 'AT17. store offer ID preserved');

// === getTrackedCouponLink tests ===
console.log('\n--- getTrackedCouponLink ---');

const gcl1 = getTrackedCouponLink('https://example.com/c?g={gclid}&k={keyword}&s={src}', 'https://fallback.com', 'G1', 'K1', 'src1');
check(gcl1, 'https://example.com/c?g=G1&k=K1&s=src1', 'GCL1. affiliate_url used');

const gcl2 = getTrackedCouponLink(null, 'https://fallback.com/c?g={gclid}', 'G1', 'K1');
check(gcl2, 'https://fallback.com/c?g=G1', 'GCL2. fallback to website_url');

const gcl3 = getTrackedCouponLink(null, '', 'G1', 'K1');
check(gcl3, '#', 'GCL3. fallback to #');

// backward compat
const gcl4 = getTrackedCouponLink('https://example.com/c?g={gclid}', 'https://fallback.com', 'G1', 'K1');
check(gcl4, 'https://example.com/c?g=G1', 'GCL4. backward compat (no new params)');

// === getTrackedWebsiteUrl tests ===
console.log('\n--- getTrackedWebsiteUrl ---');

const gwu1 = getTrackedWebsiteUrl('https://example.com/w?g={gclid}&s={src}&c={camp}&a={acc}', 'https://fallback.com', 'G1', 'K1', '', 'camp1', 'acc1');
check(gwu1, 'https://example.com/w?g=G1&s=&c=camp1&a=acc1', 'GWU1. affiliate_url used, missing src removed');

// === Both URL fields support macros ===
console.log('\n--- Both fields support macros ---');

const both1 = applyTrackingToUrl('https://example.com/aff?g={gclid}&k={keyword}&s={src}&c={camp}&a={acc}', 'G1', 'K1', 'src1', 'camp1', 'acc1');
check(both1.includes('g=G1'), true, 'BOTH1. affiliate_url: gclid');
check(both1.includes('s=src1'), true, 'BOTH2. affiliate_url: src');

const both2 = applyTrackingToUrl('https://example.com/web?g={gclid}&k={keyword}&s={src}&c={camp}&a={acc}', 'G1', 'K1', 'src1', 'camp1', 'acc1');
check(both2.includes('g=G1'), true, 'BOTH3. website_url: gclid');
check(both2.includes('s=src1'), true, 'BOTH4. website_url: src');

// === initializeTracking tests ===
console.log('\n--- initializeTracking ---');

// Mock window and document with cookie jar behavior
function createCookieJar(initial: string = '') {
  let cookies: string[] = initial ? initial.split('; ').filter(Boolean) : [];
  const jar = {
    get cookie() { return cookies.join('; '); },
    set cookie(val: string) {
      // Parse the cookie name from the value
      const name = val.split('=')[0];
      // Remove existing cookie with same name
      cookies = cookies.filter(c => !c.startsWith(name + '='));
      // Add new cookie (extract just name=value part before semicolons)
      const nv = val.split(';')[0];
      if (nv) cookies.push(nv);
    },
  };
  return jar;
}

const mockDoc = createCookieJar('');
const mockWin = { location: { search: '?gclid=G1&keyword=K1&src=S1&camp=C1&acc=A1', href: 'http://localhost:3000/?gclid=G1&keyword=K1&src=S1&camp=C1&acc=A1' } };
// @ts-ignore
global.document = mockDoc;
// @ts-ignore
global.window = mockWin;

initializeTracking();

check(mockDoc.cookie.includes('fdc_gclid=G1'), true, 'INIT1. gclid cookie set');
check(mockDoc.cookie.includes('fdc_src=S1'), true, 'INIT2. src cookie set');
check(mockDoc.cookie.includes('fdc_camp=C1'), true, 'INIT3. camp cookie set');
check(mockDoc.cookie.includes('fdc_acc=A1'), true, 'INIT4. acc cookie set');

// Empty params don't overwrite
const mockDoc2 = createCookieJar('fdc_src=existing; fdc_camp=existing; fdc_acc=existing');
const mockWin2 = { location: { search: '?gclid=G2', href: 'http://localhost:3000/?gclid=G2' } };
// @ts-ignore
global.document = mockDoc2;
// @ts-ignore
global.window = mockWin2;

initializeTracking();

check(mockDoc2.cookie.includes('fdc_src=existing'), true, 'INIT5. empty src does not overwrite existing cookie');

// Cleanup
// @ts-ignore
delete global.document;
// @ts-ignore
delete global.window;

// === getTrackingValues tests ===
console.log('\n--- getTrackingValues ---');

// With searchParams
const gtv1 = getTrackingValues(new URLSearchParams('gclid=G1&keyword=K1&src=S1&camp=C1&acc=A1'));
check(gtv1, { gclid: 'G1', keyword: 'K1', src: 'S1', camp: 'C1', acc: 'A1' }, 'GTV1. all params from URL');

// URL takes precedence over stored
const mockDoc3 = { cookie: 'fdc_gclid=STORED_G; fdc_src=STORED_S' };
// @ts-ignore
global.document = mockDoc3;
const gtv2 = getTrackingValues(new URLSearchParams('gclid=URL_G'));
check(gtv2.gclid, 'URL_G', 'GTV2. URL gclid takes precedence');
check(gtv2.src, 'STORED_S', 'GTV3. stored src used when URL missing');
// @ts-ignore
delete global.document;

// No searchParams
const mockDoc4 = { cookie: 'fdc_gclid=C1; fdc_keyword=K1; fdc_src=S1; fdc_camp=C1; fdc_acc=A1' };
// @ts-ignore
global.document = mockDoc4;
const gtv3 = getTrackingValues();
check(gtv3, { gclid: 'C1', keyword: 'K1', src: 'S1', camp: 'C1', acc: 'A1' }, 'GTV4. all from cookies when no searchParams');
// @ts-ignore
delete global.document;

// === URL encoding exactly once ===
console.log('\n--- URL encoding ---');

const ue1 = applyTrackingToUrl('https://example.com/t?c={camp}', '', '', '', 'Shein Search', '');
check(ue1, 'https://example.com/t?c=Shein%20Search', 'UE1. space encoded once');

const ue2 = applyTrackingToUrl('https://example.com/t?s={src}', '', '', 'a+b', '', '');
check(ue2, 'https://example.com/t?s=a%2Bb', 'UE2. plus encoded once');

// === No unresolved macros ===
console.log('\n--- No unresolved macros ---');

const nu1 = applyTrackingToUrl('https://example.com/t?s={src}&c={camp}&a={acc}', 'G', 'K', '', '', '');
check(!nu1.includes('{src}'), true, 'NU1. no literal {src}');
check(!nu1.includes('{camp}'), true, 'NU2. no literal {camp}');
check(!nu1.includes('{acc}'), true, 'NU3. no literal {acc}');

// === Summary ===
console.log('\n=== Tracking Test Summary ===');
console.log(`Failures: ${failures}`);
if (failures > 0) {
  process.exit(1);
}