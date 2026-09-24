import { parseCountryCodes, normalizeCouponData } from './validator';
import { getCountryUpdateIntent, resolveCountryIds } from './importer';

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

function testParse() {
  console.log('\n--- parseCountryCodes ---');

  check(parseCountryCodes('US'), ['US'], '1. parseCountryCodes("US") → ["US"]');
  check(parseCountryCodes('US, ca'), ['US', 'CA'], '2. parseCountryCodes("US, ca") → ["US", "CA"]');
  check(
    parseCountryCodes('US,US,CA'),
    ['US', 'CA'],
    '3. parseCountryCodes("US,US,CA") → ["US", "CA"] (dedupe)'
  );
  check(parseCountryCodes(''), undefined, '4. parseCountryCodes("") → undefined');
  check(parseCountryCodes('   '), undefined, '5. parseCountryCodes("   ") → undefined');
  check(parseCountryCodes('GLOBAL'), 'GLOBAL', '6. parseCountryCodes("GLOBAL") → "GLOBAL"');
  check(parseCountryCodes(' global '), 'GLOBAL', '7. parseCountryCodes(" global ") → "GLOBAL"');
  check(parseCountryCodes(undefined), undefined, '8. parseCountryCodes(undefined) → undefined');
  check(parseCountryCodes(null), undefined, 'parseCountryCodes(null) → undefined');
  // Unknown codes normalize without throwing; Strapi resolution rejects them.
  check(parseCountryCodes('ZZ'), ['ZZ'], 'parseCountryCodes("ZZ") → ["ZZ"] (no throw)');
  check(
    parseCountryCodes(' us, ca '),
    ['US', 'CA'],
    '10/11. parseCountryCodes(" us, ca ") → ["US", "CA"]'
  );
}

function testNormalize() {
  console.log('\n--- normalizeCouponData country_codes ---');

  check(
    normalizeCouponData({ country_codes: 'us, ca' }).country_codes,
    'US,CA',
    'normalize joins + uppercases'
  );
  check(
    normalizeCouponData({ country_codes: 'GLOBAL' }).country_codes,
    'GLOBAL',
    'normalize keeps GLOBAL sentinel'
  );
  check(
    normalizeCouponData({}).country_codes,
    undefined,
    '17. no country_codes header → undefined (old CSV safe)'
  );
  check(
    normalizeCouponData({ country_codes: '' }).country_codes,
    undefined,
    'blank cell → undefined'
  );
}

async function testResolution() {
  console.log('\n--- resolveCountryIds (mocked Strapi) ---');

  // Mocked Strapi contains US (id 1) and CA (id 2), but not ZZ.
  const mockStrapi = {
    db: {
      query: () => ({
        findMany: async ({ where }: { where: { code: { $in: string[] } } }) => {
          const known = [
            { id: 1, code: 'US' },
            { id: 2, code: 'CA' },
          ];
          return known.filter(c => where.code.$in.includes(c.code));
        },
      }),
    },
  };

  check(
    await resolveCountryIds(mockStrapi, ['US']),
    [1],
    'US resolves to [1]'
  );
  check(
    await resolveCountryIds(mockStrapi, ['US', 'CA']),
    [1, 2],
    'US,CA resolves to [1, 2]'
  );

  // 9. Unknown code must throw a clear error.
  try {
    await resolveCountryIds(mockStrapi, ['US', 'ZZ']);
    failures++;
    console.log('✗ 9. unknown ZZ throws "Countries not found: ZZ" (did not throw)');
  } catch (error) {
    check(
      (error as Error).message,
      'Countries not found: ZZ',
      '9. unknown ZZ throws "Countries not found: ZZ"'
    );
  }
}

function testSemantics() {
  console.log('\n--- new/existing coupon semantics ---');

  // 10/11. New coupon: blank/GLOBAL → countries []
  check(
    getCountryUpdateIntent(undefined, true),
    { action: 'set', codes: [] },
    '10. new + blank → set [] (GLOBAL)'
  );
  check(
    getCountryUpdateIntent('GLOBAL', true),
    { action: 'set', codes: [] },
    '11. new + GLOBAL → set []'
  );
  // 12. New coupon + US → set [US]
  check(
    getCountryUpdateIntent('US', true),
    { action: 'set', codes: ['US'] },
    '12. new + US → set [US]'
  );
  // 13. Existing coupon + blank → omit (preserve)
  check(
    getCountryUpdateIntent(undefined, false),
    { action: 'omit' },
    '13. existing + blank → omit (preserve)'
  );
  // 14. Existing coupon + GLOBAL → clear
  check(
    getCountryUpdateIntent('GLOBAL', false),
    { action: 'set', codes: [] },
    '14. existing + GLOBAL → set [] (clear)'
  );
  // 15/16. Existing coupon + codes → replace
  check(
    getCountryUpdateIntent('US', false),
    { action: 'set', codes: ['US'] },
    '15. existing + US → set [US] (replace)'
  );
  check(
    getCountryUpdateIntent('US,CA', false),
    { action: 'set', codes: ['US', 'CA'] },
    '16. existing + US,CA → set [US, CA] (replace)'
  );
}

async function main() {
  console.log('=== countryCodes Tests ===');
  testParse();
  testNormalize();
  await testResolution();
  testSemantics();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
