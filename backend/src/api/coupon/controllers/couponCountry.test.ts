import { normalizeCountryParam, withCountryFilter, COUPON_LIST_POPULATE } from './coupon';

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

function countryBranch(code: string) {
  return {
    $and: [
      { publishedAt: { $notNull: true } },
      {
        $or: [
          { countries: { code: { $eq: code } } },
          { countries: { id: { $null: true } } },
        ],
      },
    ],
  };
}

function testNormalize() {
  console.log('\n--- normalizeCountryParam ---');

  check(normalizeCountryParam(undefined), undefined, '1a. missing → undefined (no filter)');
  check(normalizeCountryParam(''), undefined, '1b. empty string → undefined (no filter)');
  check(normalizeCountryParam('   '), undefined, 'blank → undefined (no filter)');
  check(normalizeCountryParam('us'), 'US', '5. "us" → "US"');
  check(normalizeCountryParam(' US  '), 'US', '6. " US  " → "US"');
  check(normalizeCountryParam('in'), 'IN', 'lowercase IN → IN');
  check(normalizeCountryParam('USA'), undefined, 'malformed "USA" → undefined (ignored)');
  check(normalizeCountryParam('U1'), undefined, 'malformed "U1" → undefined (ignored)');
  check(normalizeCountryParam('ZZ'), 'ZZ', '7. "ZZ" stays valid (globals-only downstream)');
}

function testWhere() {
  console.log('\n--- withCountryFilter ---');

  const base = { publishedAt: { $notNull: true } };

  // 1. No country → base where returned unchanged (existing behavior).
  check(
    withCountryFilter(base, undefined),
    base,
    '1. no country → where unchanged'
  );

  // 2/3/4. Country → GLOBAL (empty relation) + requested code.
  check(withCountryFilter(base, 'US'), countryBranch('US'), '2. country=US → GLOBAL + US');
  check(withCountryFilter(base, 'IN'), countryBranch('IN'), '3. country=IN → GLOBAL + IN');
  check(withCountryFilter(base, 'AR'), countryBranch('AR'), '4. country=AR → GLOBAL + AR');

  // 7. Unknown code keeps valid filter shape (no throw, no write).
  check(
    withCountryFilter(base, 'ZZ'),
    countryBranch('ZZ'),
    '7. country=ZZ → valid filter (globals only at query time)'
  );

  // 8. Existing store filter composes with AND, not OR.
  const withStore = { publishedAt: { $notNull: true }, store: { slug: { $eq: 'shein' } } };
  const storeResult = withCountryFilter(withStore, 'US');
  check(
    storeResult,
    {
      $and: [
        withStore,
        {
          $or: [
            { countries: { code: { $eq: 'US' } } },
            { countries: { id: { $null: true } } },
          ],
        },
      ],
    },
    '8. store + country → both apply (AND)'
  );

  // 9. Existing expiry filter composes with AND.
  const withExpiry = { publishedAt: { $notNull: true }, is_expired: false };
  const expiryResult = withCountryFilter(withExpiry, 'US') as {
    $and: [unknown, { $or: unknown[] }];
  };
  check(
    expiryResult.$and[0],
    withExpiry,
    '9. expiry filter preserved alongside country filter'
  );

  // 12/13. Targeted branch matches the requested code only.
  const usOr = (withCountryFilter(base, 'US') as { $and: [unknown, { $or: unknown[] }] })
    .$and[1].$or;
  check(
    usOr,
    [{ countries: { code: { $eq: 'US' } } }, { countries: { id: { $null: true } } }],
    '12/13. US branch matches code US (a US coupon visible; IN-only not matched)'
  );

  // 14/15. Empty-relation branch keeps GLOBAL coupons eligible for every
  // country; a [US,CA] coupon matches the code branch for US and CA.
  const inOr = (withCountryFilter(base, 'IN') as { $and: [unknown, { $or: unknown[] }] })
    .$and[1].$or;
  check(
    inOr[1],
    { countries: { id: { $null: true } } },
    '14. GLOBAL (empty countries) eligible for IN too'
  );
  check(
    inOr[0],
    { countries: { code: { $eq: 'IN' } } },
    '15. code branch is per-request (no cross-country leak)'
  );
}

function testContract() {
  console.log('\n--- wiring contract ---');

  // 10/11. The controller passes one shared `where` to both findMany and
  // count (filter-before-pagination) and never touches sort for country.
  // Verified by construction: `find` computes `where` once via
  // withCountryFilter() and reuses it for both calls; sort/pagination code
  // paths are untouched. This test pins the helper purity behind it:
  const base = { publishedAt: { $notNull: true }, is_featured: true };
  const first = withCountryFilter(base, 'US');
  const second = withCountryFilter(base, 'US');
  check(first, second, '10/11. helper is pure/deterministic (same where every call)');
  check(base, { publishedAt: { $notNull: true }, is_featured: true }, 'base where not mutated');
}

function testListPopulate() {
  console.log('\n--- COUPON_LIST_POPULATE ---');

  const populate = COUPON_LIST_POPULATE as unknown as Record<string, unknown>;

  // Must be object form: the db-layer parser calls `.split('.')` on every
  // array entry, so a nested object inside an array crashes all requests.
  check(Array.isArray(populate), false, 'populate is object form, not an array');

  // Pre-existing relations retained (object form equivalent of the old strings).
  check(populate['store'], { populate: ['logo'] }, 'populate retains store → logo');
  check(populate['categories'], true, 'populate retains categories');

  // Countries exposed code-only via the db-layer `select` key.
  const countries = populate['countries'] as { select?: unknown } | undefined;
  check(countries?.select, ['code'], 'populate exposes countries.code only');

  const serialized = JSON.stringify(populate);
  check(serialized.includes('"name"'), false, 'no Country name field exposed');
  check(serialized.includes('"flag"'), false, 'no Country flag field exposed');
  check(serialized.includes('"coupons"'), false, 'no Country back-relation exposed');
  check(serialized.includes('"fields"'), false, 'no entityService-style fields key (db layer drops it)');
}

function testPopulateCrashClass() {
  console.log('\n--- populate crash-class regression guard ---');

  // Walk the whole populate tree: no array may hold a non-string entry
  // (db-layer processPopulate calls key.split('.') on each array item).
  const violations: string[] = [];
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        if (typeof node[i] !== 'string') {
          violations.push(`${path}[${i}]`);
        } else {
          walk(node[i], `${path}[${i}]`);
        }
      }
    } else if (node !== null && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        walk(value, path ? `${path}.${key}` : key);
      }
    }
  };
  walk(COUPON_LIST_POPULATE, '');
  check(violations, [], 'no non-string entry inside any populate array');
}

async function main() {
  console.log('=== couponCountry Tests ===');
  testNormalize();
  testWhere();
  testContract();
  testListPopulate();
  testPopulateCrashClass();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
