import { normalizeCouponData } from './validator';

function testDate(input: string, expected: string | null, description: string) {
  const result = normalizeCouponData({ expires_at: input });
  const actual = result.expires_at ?? null;
  const pass = actual === expected;
  console.log(`${pass ? '✓' : '✗'} ${description}`);
  if (!pass) {
    console.log(`  Input:    "${input}"`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
  }
  return pass;
}

function testDateOnlyFormats() {
  console.log('\n--- Date-Only Formats (UTC, no shifting) ---');

  // YYYY-MM-DD format
  testDate('2026-09-30', '2026-09-30T23:59:59.000Z', 'YYYY-MM-DD: 2026-09-30');
  testDate('2026-12-31', '2026-12-31T23:59:59.000Z', 'YYYY-MM-DD: 2026-12-31 (year end)');
  testDate('2026-01-01', '2026-01-01T23:59:59.000Z', 'YYYY-MM-DD: 2026-01-01 (year start)');
  testDate('2026-02-28', '2026-02-28T23:59:59.000Z', 'YYYY-MM-DD: 2026-02-28');

  // YYYY/MM/DD format
  testDate('2026/09/30', '2026-09-30T23:59:59.000Z', 'YYYY/MM/DD: 2026/09/30');
  testDate('2026/12/31', '2026-12-31T23:59:59.000Z', 'YYYY/MM/DD: 2026/12/31');

  // DD-MM-YYYY format
  testDate('30-09-2026', '2026-09-30T23:59:59.000Z', 'DD-MM-YYYY: 30-09-2026');
  testDate('31-12-2026', '2026-12-31T23:59:59.000Z', 'DD-MM-YYYY: 31-12-2026');
  testDate('01-01-2026', '2026-01-01T23:59:59.000Z', 'DD-MM-YYYY: 01-01-2026');

  // DD/MM/YYYY format
  testDate('30/09/2026', '2026-09-30T23:59:59.000Z', 'DD/MM/YYYY: 30/09/2026');
  testDate('31/12/2026', '2026-12-31T23:59:59.000Z', 'DD/MM/YYYY: 31/12/2026');
}

function testIsoDatetimes() {
  console.log('\n--- ISO Datetimes (unchanged behavior) ---');

  // ISO timestamps with Z - preserve exact UTC time
  testDate('2026-09-30T12:00:00Z', '2026-09-30T12:00:00.000Z', 'ISO with Z: 2026-09-30T12:00:00Z');
  testDate('2026-09-30T00:00:00Z', '2026-09-30T00:00:00.000Z', 'ISO midnight: 2026-09-30T00:00:00Z');
  testDate('2026-09-30T23:59:59Z', '2026-09-30T23:59:59.000Z', 'ISO end of day: 2026-09-30T23:59:59Z');

  // ISO datetime without Z - parsed as local time (existing behavior preserved)
  // In UTC+5:30, "2026-09-30T12:00:00" local = "2026-09-30T06:30:00Z" UTC
  const localResult = normalizeCouponData({ expires_at: '2026-09-30T12:00:00' });
  const hasValue = localResult.expires_at !== null && localResult.expires_at !== undefined;
  console.log(`${hasValue ? '✓' : '✗'} ISO without Z: parsed as local time (existing behavior)`);
  if (!hasValue) {
    console.log(`  Expected: a valid ISO string`);
    console.log(`  Actual:   ${localResult.expires_at}`);
  }
}

function testEdgeCases() {
  console.log('\n--- Edge Cases ---');

  // Empty/invalid
  testDate('', null, 'Empty string → null');
  testDate('invalid', null, 'Invalid string → null');
  testDate('not-a-date', null, 'Not a date → null');

  // Whitespace
  testDate('  2026-09-30  ', '2026-09-30T23:59:59.000Z', 'Whitespace padded date');
}

console.log('=== normalizeDate Tests ===');
testDateOnlyFormats();
testIsoDatetimes();
testEdgeCases();
console.log('\n=== Done ===');
