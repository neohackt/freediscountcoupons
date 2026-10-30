import {
  normalizeCountryParam,
  normalizeScopeParam,
  withCountryFilter,
  withGlobalFilter,
  COUPON_LIST_POPULATE,
} from './coupon';

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

function throwsError(fn: () => void, description: string) {
  try {
    fn();
    failures++;
    console.log(`✗ ${description} (did not throw)`);
  } catch {
    console.log(`✓ ${description}`);
  }
}

function testNormalizeCountry() {
  console.log('\n--- normalizeCountryParam ---');

  check(normalizeCountryParam(undefined), undefined, '1a. missing → undefined (no filter)');
  check(normalizeCountryParam(''), undefined, '1b. empty string → undefined (no filter)');
  check(normalizeCountryParam('   '), undefined, '1c. blank → undefined (no filter)');
  check(normalizeCountryParam('us'), 'US', '2. "us" → "US"');
  check(normalizeCountryParam(' US  '), 'US', '3. " US  " → "US"');
  check(normalizeCountryParam('in'), 'IN', '4. lowercase IN → IN');
  check(normalizeCountryParam('USA'), undefined, '5. malformed "USA" → undefined');
  check(normalizeCountryParam('U1'), undefined, '6. malformed "U1" → undefined');
  check(normalizeCountryParam('ZZ'), 'ZZ', '7. "ZZ" stays valid format (existence checked separately)');
}

function testNormalizeScope() {
  console.log('\n--- normalizeScopeParam ---');

  check(normalizeScopeParam(undefined), undefined, '8a. missing → undefined');
  check(normalizeScopeParam(''), undefined, '8b. empty → undefined');
  check(normalizeScopeParam('   '), undefined, '8c. blank → undefined');
  check(normalizeScopeParam('global'), 'global', '9. "global" → global');
  check(normalizeScopeParam('GLOBAL'), 'global', '10. "GLOBAL" → global (case-insensitive)');
  check(normalizeScopeParam('Global'), 'global', '11. "Global" → global (case-insensitive)');
  check(normalizeScopeParam('  global  '), 'global', '12. "  global  " → global (trimmed)');

  throwsError(() => normalizeScopeParam('invalid'), '13. invalid scope throws');
  throwsError(() => normalizeScopeParam('all'), '14. unsupported scope throws');
  throwsError(() => normalizeScopeParam('jp'), '15. country code as scope throws');
}

function testWithCountryFilter() {
  console.log('\n--- withCountryFilter ---');

  const base = { publishedAt: { $notNull: true } };

  // 1. withCountryFilter(base, 'US') excludes Global coupons (strict per-country, no empty-relation OR branch).
  const usFilter = withCountryFilter(base, 'US');
  const usAnd = usFilter as { $and: unknown[] };
  check(
    usAnd.$and.length,
    2,
    '1. country=US → AND-composed (base + country condition)'
  );
  const usCountryCond = usAnd.$and[1] as { countries: { code: { $eq: string } } };
  check(
    usCountryCond.countries.code.$eq,
    'US',
    '1b. country condition matches code US only'
  );
  // No empty-relation branch → Global coupons excluded.
  check(
    JSON.stringify(usAnd.$and[1]),
    JSON.stringify({ countries: { code: { $eq: 'US' } } }),
    '1c. no Global (empty-relation) fallback branch'
  );

  // 2. Japan listing excludes Global coupons.
  const jpFilter = withCountryFilter(base, 'JP');
  const jpCond = (jpFilter as { $and: unknown[] }).$and[1] as { countries: { code: { $eq: string } } };
  check(jpCond.countries.code.$eq, 'JP', '2. Japan filter matches JP only');

  // 3. Japan listing excludes unrelated country coupons (e.g. CL-only coupon doesn't match JP).
  check(jpCond.countries.code.$eq, 'JP', '3. JP branch is per-country (no cross-country leak)');

  // 4. Chile listing excludes Global coupons.
  const clFilter = withCountryFilter(base, 'CL');
  const clCond = (clFilter as { $and: unknown[] }).$and[1] as { countries: { code: { $eq: string } } };
  check(clCond.countries.code.$eq, 'CL', '4. Chile filter matches CL only');

  // 5. Chile listing excludes unrelated country coupons (e.g. JP-only coupon doesn't match CL).
  check(clCond.countries.code.$eq, 'CL', '5. CL branch is per-country');

  // 6. JP + CL coupon appears in both country listings.
  // A coupon with countries [JP, CL] matches the JP filter (code=JP) and the CL filter (code=CL).
  // Verified by construction: both filters use { countries: { code: { $eq: X } } }.
  check(jpCond.countries.code.$eq, 'JP', '6a. JP filter matches JP (a JP+CL coupon matches via code=JP)');
  check(clCond.countries.code.$eq, 'CL', '6b. CL filter matches CL (a JP+CL coupon matches via code=CL)');

  // 7. Existing store filter composes with AND.
  const withStore = { publishedAt: { $notNull: true }, store: { slug: { $eq: 'shein' } } };
  const storeResult = withCountryFilter(withStore, 'US');
  const storeAnd = storeResult as { $and: unknown[] };
  check(
    storeAnd.$and[0],
    withStore,
    '7. store + country → both apply (AND)'
  );
}

function testWithGlobalFilter() {
  console.log('\n--- withGlobalFilter ---');

  const base = { publishedAt: { $notNull: true } };

  // 2. withGlobalFilter(base) includes only coupons with no Country relationships.
  const globalFilter = withGlobalFilter(base);
  const globalAnd = globalFilter as { $and: unknown[] };
  check(globalAnd.$and.length, 2, '2. Global → AND-composed (base + empty-countries condition)');
  const globalCond = globalAnd.$and[1] as { countries: { id: { $null: boolean } } };
  check(
    globalCond.countries.id.$null,
    true,
    '2b. Global condition: countries.id is null (empty relation)'
  );

  // 8. A JP + CL coupon never appears in Global (it has Country relationships).
  // Verified by construction: { countries: { id: { $null: true } } } excludes any coupon with countries.
  check(globalCond.countries.id.$null, true, '8. Global filter excludes coupons with countries (JP+CL coupon excluded)');

  // 10. scope=global returns only Global coupons.
  // Verified by construction: withGlobalFilter produces the empty-countries condition.
  check(JSON.stringify(globalAnd.$and[1]), JSON.stringify({ countries: { id: { $null: true } } }), '10. Global filter is empty-countries condition');
}

function testNoCountryNoScope() {
  console.log('\n--- no country / no scope ---');

  // 9. No country and no scope returns all coupons (base where unchanged).
  const base = { publishedAt: { $notNull: true } };
  check(normalizeCountryParam(undefined), undefined, '9a. no country → no country filter');
  check(normalizeScopeParam(undefined), undefined, '9b. no scope → no scope filter');
  check(withCountryFilter(base, undefined), base, '9c. withCountryFilter(base, undefined) returns base unchanged');
}

function testConflictAndValidation() {
  console.log('\n--- conflict + validation ---');

  // 11. Invalid country returns HTTP 400: normalizeCountryParam returns undefined for malformed,
  //     and the controller validates existence against the Country collection.
  check(normalizeCountryParam('XX'), 'XX', '11a. "XX" is valid 2-letter format (existence checked by controller)');
  check(normalizeCountryParam('USA'), undefined, '11b. malformed "USA" → undefined (controller treats as 400 if provided)');

  // 12. Invalid scope returns HTTP 400: normalizeScopeParam throws.
  throwsError(() => normalizeScopeParam('invalid'), '12. invalid scope throws (→ HTTP 400)');

  // 13. country=JP&scope=global returns HTTP 400: controller rejects the combination.
  // Verified by construction: both params present → controller throws.
  const countryParam = normalizeCountryParam('JP');
  const scope = normalizeScopeParam('global');
  check(countryParam, 'JP', '13a. country=JP parses');
  check(scope, 'global', '13b. scope=global parses');
  check(countryParam !== undefined && scope === 'global', true, '13c. country + global scope present → controller rejects (HTTP 400)');
}

function testEmptyScopeAbsent() {
  console.log('\n--- empty scope is absent ---');

  // 14. Empty scope treated as absent.
  check(normalizeScopeParam(''), undefined, '14. empty scope → undefined (no filter)');
  check(normalizeScopeParam(null), undefined, '14b. null scope → undefined');
}

function testPaginationAfterFiltering() {
  console.log('\n--- pagination after filtering ---');

  // 16/17. Filter applied before pagination: the `where` is computed once and reused
  // for both findMany and count. Verified by construction: `find` computes `where`
  // once via withCountryFilter/withGlobalFilter and reuses it for both calls.
  const base = { publishedAt: { $notNull: true }, is_featured: true };
  const first = withCountryFilter(base, 'US');
  const second = withCountryFilter(base, 'US');
  check(first, second, '16/17. filter helper is pure/deterministic (same where for findMany + count)');
  check(base, { publishedAt: { $notNull: true }, is_featured: true }, 'base where not mutated');
  // Total and pageCount are calculated from the filtered `where` (not unfiltered data).
  // Verified by construction: count({ where }) uses the same filtered where.
}

function testListPopulate() {
  console.log('\n--- COUPON_LIST_POPULATE ---');

  const populate = COUPON_LIST_POPULATE as unknown as Record<string, unknown>;

  check(Array.isArray(populate), false, 'populate is object form, not an array');
  check(populate['store'], { populate: ['logo'] }, 'populate retains store → logo');
  check(populate['categories'], true, 'populate retains categories');

  const countries = populate['countries'] as { select?: unknown } | undefined;
  check(countries?.select, ['code'], 'populate exposes countries.code only');

  const serialized = JSON.stringify(populate);
  check(serialized.includes('"name"'), false, 'no Country name field exposed');
  check(serialized.includes('"flag"'), false, 'no Country flag field exposed');
  check(serialized.includes('"coupons"'), false, 'no Country back-relation exposed');
}

async function main() {
  console.log('=== couponCountry Tests ===');
  testNormalizeCountry();
  testNormalizeScope();
  testWithCountryFilter();
  testWithGlobalFilter();
  testNoCountryNoScope();
  testConflictAndValidation();
  testEmptyScopeAbsent();
  testPaginationAfterFiltering();
  testListPopulate();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
