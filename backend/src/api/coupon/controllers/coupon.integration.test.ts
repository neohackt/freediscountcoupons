// Genuine integration test for country/Global coupon filtering.
// Creates 4 temporary published coupons directly in the DB, tests the
// actual HTTP API responses for exact coupon membership, then cleans up.
//
// Requires Strapi running on http://localhost:1337.

const STRAPI_URL = 'http://localhost:1337';
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

async function request(path: string): Promise<any> {
  const res = await fetch(`${STRAPI_URL}${path}`);
  if (!res.ok) return { status: res.status, body: await res.text() };
  return { status: res.status, body: await res.json() };
}

function createTestCoupons(): void {
  const Database = require('better-sqlite3');
  const db = new Database('E:/Coupon Website/backend/.tmp/data.db');
  const now = new Date().toISOString();

  // Get store and country IDs
  const store = db.prepare("SELECT id FROM stores WHERE slug='amazon' AND published_at IS NOT NULL LIMIT 1").get();
  const jp = db.prepare("SELECT id FROM countries WHERE code='JP' AND published_at IS NOT NULL LIMIT 1").get();
  const cl = db.prepare("SELECT id FROM countries WHERE code='CL' AND published_at IS NOT NULL LIMIT 1").get();

  if (!store || !jp || !cl) {
    throw new Error('Required store or country fixtures not found');
  }

  const coupons = [
    { code: 'INTTEST-GLOBAL', title: 'Global Test Coupon', countries: [] },
    { code: 'INTTEST-JP', title: 'Japan Test Coupon', countries: [jp.id] },
    { code: 'INTTEST-CL', title: 'Chile Test Coupon', countries: [cl.id] },
    { code: 'INTTEST-JPCL', title: 'JP+CL Test Coupon', countries: [jp.id, cl.id] },
  ];

  for (const c of coupons) {
    const docId = `inttest_${c.code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const result = db.prepare(`
      INSERT INTO coupons (document_id, title, code, discount_type, discount_value, success_rate, times_used, verified, is_featured, is_expired, published_at, created_at, updated_at)
      VALUES (?, ?, ?, 'percentage', 10, 0, 0, 0, 0, 0, ?, ?, ?)
    `).run(docId, c.title, c.code, now, now, now);

    const couponId = result.lastInsertRowid;

    // Link store
    db.prepare('INSERT INTO coupons_store_lnk (coupon_id, store_id) VALUES (?, ?)').run(couponId, store.id);

    // Link countries
    for (const countryId of c.countries) {
      db.prepare('INSERT INTO coupons_countries_lnk (coupon_id, country_id) VALUES (?, ?)').run(couponId, countryId);
    }
  }

  db.close();
}

function cleanupTestCoupons(): void {
  const Database = require('better-sqlite3');
  const db = new Database('E:/Coupon Website/backend/.tmp/data.db');
  db.prepare("DELETE FROM coupons_countries_lnk WHERE coupon_id IN (SELECT id FROM coupons WHERE code LIKE 'INTTEST%')").run();
  db.prepare("DELETE FROM coupons_store_lnk WHERE coupon_id IN (SELECT id FROM coupons WHERE code LIKE 'INTTEST%')").run();
  db.prepare("DELETE FROM coupons WHERE code LIKE 'INTTEST%'").run();
  db.close();
}

async function main() {
  console.log('=== Genuine Integration Test ===\n');

  // Create test fixtures
  console.log('Creating 4 test coupons...');
  try {
    createTestCoupons();
    console.log('Created 4 test coupons.\n');
  } catch (e) {
    console.error('Failed to create test coupons:', e);
    process.exit(1);
  }

  try {
    // Test 1: Unfiltered API returns all 4 fixtures
    const allRes: any = await request('/api/coupons?filters[code][$containsi]=INTTEST&pagination[pageSize]=100');
    const allData = allRes.body.data || [];
    const allCodes = allData.map((c: any) => c.code).sort();
    check(allCodes, ['INTTEST-CL', 'INTTEST-GLOBAL', 'INTTEST-JP', 'INTTEST-JPCL'], 'Unfiltered API returns all 4 fixtures');

    // Test 2: Global API returns exactly the Global fixture
    const globalRes: any = await request('/api/coupons?scope=global&filters[code][$containsi]=INTTEST&pagination[pageSize]=100');
    const globalData = globalRes.body.data || [];
    const globalCodes = globalData.map((c: any) => c.code).sort();
    check(globalCodes, ['INTTEST-GLOBAL'], 'Global API returns exactly the Global fixture');

    // Test 3: Japan API returns JP-only and JP+CL fixtures
    const jpRes: any = await request('/api/coupons?country=JP&filters[code][$containsi]=INTTEST&pagination[pageSize]=100');
    const jpData = jpRes.body.data || [];
    const jpCodes = jpData.map((c: any) => c.code).sort();
    check(jpCodes, ['INTTEST-JP', 'INTTEST-JPCL'], 'Japan API returns JP and JP+CL fixtures');

    // Test 4: Chile API returns CL-only and JP+CL fixtures
    const clRes: any = await request('/api/coupons?country=CL&filters[code][$containsi]=INTTEST&pagination[pageSize]=100');
    const clData = clRes.body.data || [];
    const clCodes = clData.map((c: any) => c.code).sort();
    check(clCodes, ['INTTEST-CL', 'INTTEST-JPCL'], 'Chile API returns CL and JP+CL fixtures');

    // Test 5: No country-specific fixture appears in Global
    const globalCountryLeak = globalData.filter((c: any) => c.code !== 'INTTEST-GLOBAL');
    check(globalCountryLeak.length, 0, 'No country-specific fixture in Global');

    // Test 6: Global fixture does not appear in Japan or Chile
    const jpGlobalLeak = jpData.filter((c: any) => c.code === 'INTTEST-GLOBAL');
    const clGlobalLeak = clData.filter((c: any) => c.code === 'INTTEST-GLOBAL');
    check(jpGlobalLeak.length + clGlobalLeak.length, 0, 'Global fixture not in Japan or Chile');

    // Test 7: Country + Global scope returns HTTP 400
    const conflictRes: any = await request('/api/coupons?country=JP&scope=global&pagination[pageSize]=1');
    check(conflictRes.status, 400, 'Country + Global scope returns HTTP 400');

    // Test 8: Invalid country returns HTTP 400
    const badCountryRes: any = await request('/api/coupons?country=ZZ&pagination[pageSize]=1');
    check(badCountryRes.status, 400, 'Invalid country returns HTTP 400');

    // Test 9: Invalid scope returns HTTP 400
    const badScopeRes: any = await request('/api/coupons?scope=invalid&pagination[pageSize]=1');
    check(badScopeRes.status, 400, 'Invalid scope returns HTTP 400');

    // Test 10: Pagination reflects filter
    const globalPageRes: any = await request('/api/coupons?scope=global&filters[code][$containsi]=INTTEST&pagination[pageSize]=1');
    const globalMeta = globalPageRes.body.meta?.pagination || {};
    check(globalMeta.total, 1, 'Global pagination total is 1');
    check(globalMeta.pageCount, 1, 'Global pagination pageCount is 1');

  } catch (error) {
    console.error('Integration test error:', error);
    failures++;
  } finally {
    // Clean up all temporary coupon documents
    try {
      cleanupTestCoupons();
      console.log('\nCleaned up all test coupons.');
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  }

  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
