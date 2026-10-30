import { parseCountryCodes, normalizeCouponData } from './validator';
import { resolveCountryIds } from './importer';

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
  check(parseCountryCodes(''), undefined, '4. parseCountryCodes("") → undefined (empty)');
  check(parseCountryCodes('   '), undefined, '5. parseCountryCodes("   ") → undefined (whitespace)');
  check(parseCountryCodes(undefined), undefined, '6. parseCountryCodes(undefined) → undefined');
  check(parseCountryCodes(null), undefined, '7. parseCountryCodes(null) → undefined');
  // GLOBAL is no longer a sentinel: it passes through as a code and fails ISO validation later.
  check(parseCountryCodes('GLOBAL'), ['GLOBAL'], '8. parseCountryCodes("GLOBAL") → ["GLOBAL"] (no sentinel)');
  check(parseCountryCodes(' global '), ['GLOBAL'], '9. parseCountryCodes(" global ") → ["GLOBAL"] (no sentinel)');
  // Unknown codes normalize without throwing; Strapi resolution rejects them.
  check(parseCountryCodes('ZZ'), ['ZZ'], '10. parseCountryCodes("ZZ") → ["ZZ"] (no throw)');
  check(
    parseCountryCodes(' us, ca '),
    ['US', 'CA'],
    '11. parseCountryCodes(" us, ca ") → ["US", "CA"]'
  );
}

function testNormalize() {
  console.log('\n--- normalizeCouponData country_codes ---');

  check(
    normalizeCouponData({ country_codes: 'us, ca' }).country_codes,
    'US,CA',
    'normalize joins + uppercases'
  );
  // GLOBAL is no longer preserved as a sentinel: it becomes the literal code 'GLOBAL'.
  check(
    normalizeCouponData({ country_codes: 'GLOBAL' }).country_codes,
    'GLOBAL',
    'normalize keeps GLOBAL as literal code (fails ISO validation later)'
  );
  check(
    normalizeCouponData({}).country_codes,
    undefined,
    'no country_codes header → undefined'
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

  // Unknown code must throw a clear error.
  try {
    await resolveCountryIds(mockStrapi, ['US', 'ZZ']);
    failures++;
    console.log('✗ unknown ZZ throws "Countries not found: ZZ" (did not throw)');
  } catch (error) {
    check(
      (error as Error).message,
      'Countries not found: ZZ',
      'unknown ZZ throws "Countries not found: ZZ"'
    );
  }
}

async function main() {
  console.log('=== countryCodes Tests ===');
  testParse();
  testNormalize();
  await testResolution();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
