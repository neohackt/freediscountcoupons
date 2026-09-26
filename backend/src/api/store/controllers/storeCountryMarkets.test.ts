import { buildCountryMarkets } from './store';

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

const US = { code: 'US', name: 'United States', flag: '🇺🇸' };
const IN = { code: 'IN', name: 'India', flag: '🇮🇳' };
const CA = { code: 'CA', name: 'Canada', flag: '🇨🇦' };

const global = (id: number) => ({ id, countries: [] as never[] });
const targeted = (id: number, countries: Array<{ code: string; name: string; flag: string }>) => ({
  id,
  countries,
});

function testMarkets() {
  console.log('\n--- buildCountryMarkets ---');

  // 1. Only global coupons → no markets.
  check(
    buildCountryMarkets([global(1), global(2)]),
    { countries: [], hasMultipleCountries: false },
    '1. global-only → [] / false'
  );

  // 2. US coupons only → [US].
  check(
    buildCountryMarkets([targeted(1, [US]), targeted(2, [US])]),
    {
      countries: [{ ...US, couponCount: 2 }],
      hasMultipleCountries: false,
    },
    '2. US-only → [US] / false'
  );

  // 3. US + IN → both, multiple.
  check(
    buildCountryMarkets([targeted(1, [US]), targeted(2, [IN])]),
    {
      countries: [
        { ...IN, couponCount: 1 },
        { ...US, couponCount: 1 },
      ],
      hasMultipleCountries: true,
    },
    '3. US + IN → [IN, US] sorted / true'
  );

  // 4. Global + US + IN → globals ignored.
  check(
    buildCountryMarkets([global(1), targeted(2, [US]), targeted(3, [IN])]),
    {
      countries: [
        { ...IN, couponCount: 1 },
        { ...US, couponCount: 1 },
      ],
      hasMultipleCountries: true,
    },
    '4. global + US + IN → [IN, US] / true'
  );

  // 5. Same US coupon listed twice in input still counts once per record;
  // duplicate country rows on one coupon collapse to a single market entry.
  check(
    buildCountryMarkets([targeted(1, [US]), targeted(2, [US]), targeted(3, [US])]),
    {
      countries: [{ ...US, couponCount: 3 }],
      hasMultipleCountries: false,
    },
    '5. repeated US → single entry, couponCount 3'
  );

  // 6. Multi-country coupon counts once for each applicable country.
  check(
    buildCountryMarkets([targeted(1, [US, CA]), targeted(2, [US])]),
    {
      countries: [
        { ...CA, couponCount: 1 },
        { ...US, couponCount: 2 },
      ],
      hasMultipleCountries: true,
    },
    '6. [US,CA] coupon → CA:1, US:2'
  );

  // 7/8. Expired/draft filtering happens in the query layer (is_expired +
  // publishedAt); the helper only ever receives active coupons. A coupon
  // with an empty relation contributes nothing regardless.
  check(
    buildCountryMarkets([global(1)]),
    { countries: [], hasMultipleCountries: false },
    '7/8. empty-relation coupon creates no market'
  );

  // 9. Global + one targeted country → single market.
  check(
    buildCountryMarkets([global(1), global(2), targeted(3, [US])]),
    {
      countries: [{ ...US, couponCount: 1 }],
      hasMultipleCountries: false,
    },
    '9. global + US → [US] / false'
  );

  // 10. No coupons → empty.
  check(
    buildCountryMarkets([]),
    { countries: [], hasMultipleCountries: false },
    '10. no coupons → [] / false'
  );
  check(
    buildCountryMarkets(null),
    { countries: [], hasMultipleCountries: false },
    '10b. null input → [] / false'
  );

  // 11. Store.country string field is never read — result is identical
  // whether or not a store-level country value exists (helper takes only
  // coupons; store country is not a parameter at all).
  const coupons = [targeted(1, [IN])];
  check(
    buildCountryMarkets(coupons),
    {
      countries: [{ ...IN, couponCount: 1 }],
      hasMultipleCountries: false,
    },
    '11. store.country irrelevant (helper input is coupons only)'
  );

  // 12. Deterministic, unique, name-sorted output.
  const result = buildCountryMarkets([targeted(1, [US]), targeted(2, [IN]), targeted(3, [CA])]);
  const codes = result.countries.map((c) => c.code);
  check(codes, ['CA', 'IN', 'US'], '12a. sorted by name (Canada, India, United States)');
  check(new Set(codes).size, codes.length, '12b. codes unique');
  check(result.hasMultipleCountries, true, '12c. three markets → true');
}

async function main() {
  console.log('=== storeCountryMarkets Tests ===');
  testMarkets();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
