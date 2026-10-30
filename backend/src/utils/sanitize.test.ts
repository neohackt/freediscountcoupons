import { stripPaidTrafficFields } from './sanitize';

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

function testSanitize() {
  console.log('\n--- stripPaidTrafficFields ---');

  // 1. Store object with all three private fields → removed
  const store1 = {
    id: 1,
    name: 'Test Store',
    slug: 'test-store',
    paid_traffic_enabled: true,
    paid_traffic_tracking_url: 'https://example.com/track?tid={tid}',
    paid_traffic_sources: ['paid'],
    website_url: 'https://example.com',
  };
  stripPaidTrafficFields(store1);
  check(
    store1,
    { id: 1, name: 'Test Store', slug: 'test-store', website_url: 'https://example.com' },
    '1. Store with all three fields → all removed'
  );

  // 2. Store without private fields → unchanged
  const store2 = { id: 2, name: 'Clean Store', slug: 'clean-store', website_url: 'https://clean.com' };
  const store2Copy = JSON.parse(JSON.stringify(store2));
  stripPaidTrafficFields(store2);
  check(store2, store2Copy, '2. Store without private fields → unchanged');

  // 3. Array of stores → all sanitized
  const stores = [
    { id: 1, name: 'A', paid_traffic_enabled: true, paid_traffic_tracking_url: 'url1', paid_traffic_sources: ['paid'] },
    { id: 2, name: 'B', paid_traffic_enabled: false, paid_traffic_tracking_url: null, paid_traffic_sources: [] },
  ];
  stripPaidTrafficFields(stores);
  check(
    stores,
    [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    '3. Array of stores → all sanitized'
  );

  // 4. Coupon with nested Store → nested fields removed
  const coupon1 = {
    id: 1,
    title: 'Test Coupon',
    code: 'TEST10',
    store: {
      id: 1,
      name: 'Test Store',
      slug: 'test-store',
      paid_traffic_enabled: true,
      paid_traffic_tracking_url: 'https://example.com/track',
      paid_traffic_sources: ['paid'],
    },
  };
  stripPaidTrafficFields(coupon1);
  check(
    coupon1,
    {
      id: 1,
      title: 'Test Coupon',
      code: 'TEST10',
      store: { id: 1, name: 'Test Store', slug: 'test-store' },
    },
    '4. Coupon with nested Store → nested fields removed'
  );

  // 5. Array of coupons with nested stores → all sanitized
  const coupons = [
    {
      id: 1,
      title: 'C1',
      store: { id: 1, name: 'S1', paid_traffic_enabled: true, paid_traffic_tracking_url: 'u1', paid_traffic_sources: ['paid'] },
    },
    {
      id: 2,
      title: 'C2',
      store: { id: 2, name: 'S2', paid_traffic_enabled: false, paid_traffic_tracking_url: null, paid_traffic_sources: [] },
    },
  ];
  stripPaidTrafficFields(coupons);
  check(
    coupons,
    [
      { id: 1, title: 'C1', store: { id: 1, name: 'S1' } },
      { id: 2, title: 'C2', store: { id: 2, name: 'S2' } },
    ],
    '5. Array of coupons with nested stores → all sanitized'
  );

  // 6. null → no-op
  stripPaidTrafficFields(null);
  check(true, true, '6. null → no-op (no throw)');

  // 7. undefined → no-op
  stripPaidTrafficFields(undefined);
  check(true, true, '7. undefined → no-op (no throw)');

  // 8. Primitives → no-op
  stripPaidTrafficFields('string');
  stripPaidTrafficFields(42);
  stripPaidTrafficFields(true);
  check(true, true, '8. Primitives → no-op (no throw)');

  // 9. Empty object → remains valid
  const empty = {};
  stripPaidTrafficFields(empty);
  check(empty, {}, '9. Empty object → remains valid');

  // 10. Deeply nested response objects
  const deep = {
    data: {
      stores: [
        {
          id: 1,
          name: 'Deep Store',
          paid_traffic_enabled: true,
          paid_traffic_tracking_url: 'deep-url',
          paid_traffic_sources: ['paid'],
          coupons: [
            {
              id: 10,
              title: 'Deep Coupon',
              store: {
                id: 1,
                name: 'Deep Store',
                paid_traffic_enabled: true,
                paid_traffic_tracking_url: 'deep-url',
                paid_traffic_sources: ['paid'],
              },
            },
          ],
        },
      ],
    },
  };
  stripPaidTrafficFields(deep);
  check(
    deep,
    {
      data: {
        stores: [
          {
            id: 1,
            name: 'Deep Store',
            coupons: [
              {
                id: 10,
                title: 'Deep Coupon',
                store: { id: 1, name: 'Deep Store' },
              },
            ],
          },
        ],
      },
    },
    '10. Deeply nested response objects → all stripped'
  );

  // 11. Only exact property names removed
  const obj = {
    paid_traffic_enabled: true,
    paid_traffic_tracking_url: 'url',
    paid_traffic_sources: ['paid'],
    paid_traffic_enabled_extra: 'keep',
    my_paid_traffic_enabled: 'keep',
    paid_traffic: 'keep',
  };
  stripPaidTrafficFields(obj);
  check(
    obj,
    {
      paid_traffic_enabled_extra: 'keep',
      my_paid_traffic_enabled: 'keep',
      paid_traffic: 'keep',
    },
    '11. Only exact property names removed'
  );

  // 12. Ordinary properties preserved
  const full = {
    id: 1,
    name: 'Store',
    slug: 'store',
    logo: { url: '/uploads/logo.webp' },
    description: 'desc',
    website_url: 'https://example.com',
    affiliate_url: 'https://aff.example.com',
    is_popular: true,
    is_featured: false,
    categories: [{ id: 1, name: 'Cat' }],
    coupons: [{ id: 1, title: 'Coupon' }],
    paid_traffic_enabled: true,
    paid_traffic_tracking_url: 'secret-url',
    paid_traffic_sources: ['paid'],
  };
  stripPaidTrafficFields(full);
  check(
    full,
    {
      id: 1,
      name: 'Store',
      slug: 'store',
      logo: { url: '/uploads/logo.webp' },
      description: 'desc',
      website_url: 'https://example.com',
      affiliate_url: 'https://aff.example.com',
      is_popular: true,
      is_featured: false,
      categories: [{ id: 1, name: 'Cat' }],
      coupons: [{ id: 1, title: 'Coupon' }],
    },
    '12. Ordinary properties preserved'
  );

  // 13. Idempotent: calling twice produces same result
  const idempotent = {
    id: 1,
    name: 'Store',
    paid_traffic_enabled: true,
    paid_traffic_tracking_url: 'url',
    paid_traffic_sources: ['paid'],
  };
  stripPaidTrafficFields(idempotent);
  const afterFirst = JSON.stringify(idempotent);
  stripPaidTrafficFields(idempotent);
  const afterSecond = JSON.stringify(idempotent);
  check(afterFirst === afterSecond, true, '13. Idempotent: calling twice produces same result');

  // 14. Date objects are not corrupted
  const withDate = {
    id: 1,
    name: 'Store',
    createdAt: new Date('2024-01-01'),
    paid_traffic_enabled: true,
  };
  const originalDate = withDate.createdAt.getTime();
  stripPaidTrafficFields(withDate);
  check(
    withDate.createdAt instanceof Date && withDate.createdAt.getTime() === originalDate,
    true,
    '14. Date objects are not corrupted'
  );

  // 15. Event with nested stores
  const event = {
    id: 1,
    name: 'Event',
    stores: [
      { id: 1, name: 'Store A', paid_traffic_enabled: true, paid_traffic_tracking_url: 'url-a', paid_traffic_sources: ['paid'] },
      { id: 2, name: 'Store B', paid_traffic_enabled: false, paid_traffic_tracking_url: null, paid_traffic_sources: [] },
    ],
  };
  stripPaidTrafficFields(event);
  check(
    event,
    {
      id: 1,
      name: 'Event',
      stores: [
        { id: 1, name: 'Store A' },
        { id: 2, name: 'Store B' },
      ],
    },
    '15. Event with nested stores → all stripped'
  );

  // 16. Category with nested stores
  const category = {
    id: 1,
    name: 'Category',
    stores: [
      { id: 1, name: 'Store A', paid_traffic_enabled: true, paid_traffic_tracking_url: 'url-a', paid_traffic_sources: ['paid'] },
    ],
  };
  stripPaidTrafficFields(category);
  check(
    category,
    { id: 1, name: 'Category', stores: [{ id: 1, name: 'Store A' }] },
    '16. Category with nested stores → all stripped'
  );
}

function main() {
  console.log('=== sanitize Tests ===');
  testSanitize();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
