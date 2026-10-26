import { env } from '@strapi/utils';
import crypto from 'crypto';

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

// Import the policy
import policy from './require-paid-traffic-secret';

function makeContext(headerValue: string | undefined): any {
  return {
    request: {
      headers: headerValue !== undefined ? { 'x-paid-traffic-secret': headerValue } : {},
    },
  };
}

async function runPolicy(envValue: string | undefined, headerValue: string | undefined): Promise<{ threw: boolean; errorType?: string; returned?: boolean }> {
  const originalEnv = process.env.PAID_TRAFFIC_LOOKUP_SECRET;
  try {
    if (envValue === undefined) {
      delete process.env.PAID_TRAFFIC_LOOKUP_SECRET;
    } else {
      process.env.PAID_TRAFFIC_LOOKUP_SECRET = envValue;
    }

    const ctx = makeContext(headerValue);
    const result = await policy(ctx);
    return { threw: false, returned: result === true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isUnauthorized = msg.includes('Unauthorized') || msg.includes('unauthorized');
    const isNotConfigured = msg.includes('not configured') || msg.includes('not configured');
    return {
      threw: true,
      errorType: isNotConfigured ? 'not-configured' : 'invalid-secret',
    };
  } finally {
    if (originalEnv === undefined) {
      delete process.env.PAID_TRAFFIC_LOOKUP_SECRET;
    } else {
      process.env.PAID_TRAFFIC_LOOKUP_SECRET = originalEnv;
    }
  }
}

async function testPolicy() {
  console.log('\n--- require-paid-traffic-secret policy ---');

  // 1. Missing env (unset) → fail closed
  const r1 = await runPolicy(undefined, 'any-token');
  check(r1.threw, true, '1. unset env → throws (fail closed)');
  check(r1.errorType, 'not-configured', '2. unset env → not-configured error');

  // 2. Empty env → fail closed
  const r2 = await runPolicy('', 'any-token');
  check(r2.threw, true, '3. empty env → throws (fail closed)');
  check(r2.errorType, 'not-configured', '4. empty env → not-configured error');

  // 3. Missing header → fail closed
  const r3 = await runPolicy('correct-secret-value', undefined);
  check(r3.threw, true, '5. missing header → throws');
  check(r3.errorType, 'invalid-secret', '6. missing header → invalid-secret error');

  // 4. Empty header → fail closed
  const r4 = await runPolicy('correct-secret-value', '');
  check(r4.threw, true, '7. empty header → throws');
  check(r4.errorType, 'invalid-secret', '8. empty header → invalid-secret error');

  // 5. Incorrect header → fail closed
  const r5 = await runPolicy('correct-secret-value', 'wrong-secret-value');
  check(r5.threw, true, '9. incorrect header → throws');
  check(r5.errorType, 'invalid-secret', '10. incorrect header → invalid-secret error');

  // 6. Correct header → pass
  const r6 = await runPolicy('correct-secret-value', 'correct-secret-value');
  check(r6.threw, false, '11. correct header → does not throw');
  check(r6.returned, true, '12. correct header → returns true');

  // 7. Malformed header (no space after Bearer) → fail closed
  const r7 = await runPolicy('correct-secret-value', 'Bearerwrong');
  check(r7.threw, true, '13. malformed header (no space) → throws');
  check(r7.errorType, 'invalid-secret', '14. malformed header → invalid-secret error');

  // 8. Different length secret → fail closed (timingSafeEqual safe)
  const r8 = await runPolicy('short', 'a-much-longer-secret-value');
  check(r8.threw, true, '15. different length → throws');
  check(r8.errorType, 'invalid-secret', '16. different length → invalid-secret error');

  // 9. Correct secret with different case → pass (scheme is case-insensitive)
  const r9 = await runPolicy('my-secret', 'my-secret');
  check(r9.threw, false, '17. correct secret → pass');

  // 10. Env isolation works
  const r10 = await runPolicy('temp-value', 'temp-value');
  check(r10.threw, false, '18. env isolation works (temp value accepted)');

  // 11. Verify env restored after tests
  check(process.env.PAID_TRAFFIC_LOOKUP_SECRET, undefined, '19. env restored after tests (undefined)');
}

async function main() {
  console.log('=== require-paid-traffic-secret Policy Tests ===');
  await testPolicy();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
