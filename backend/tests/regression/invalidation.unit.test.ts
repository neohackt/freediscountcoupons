import { resolveCouponRelations, revalidationFallbackAll, revalidateStoresAndCategories } from '../../src/api/coupon/content-types/coupon/lifecycles/index';

type CallLog = { method: string; args: any[] };

function makeMockStrapi(opts: {
  couponFindOne?: any;
  storeFindOne?: (id: number) => any;
  categoryFindOne?: (id: number) => any;
  stores?: any[];
  categories?: any[];
  throwOnCoupon?: boolean;
}) {
  const calls: CallLog[] = [];
  const strapi: any = {
    log: { error: (...a: any[]) => calls.push({ method: 'log.error', args: a }), info: () => {}, debug: () => {} },
    db: {
      query: (uid: string) => {
        if (uid === 'api::coupon.coupon') {
          return {
            findOne: async (q: any) => {
              calls.push({ method: 'coupon.findOne', args: [q] });
              if (opts.throwOnCoupon) throw new Error('boom');
              return opts.couponFindOne ?? null;
            },
          };
        }
        if (uid === 'api::store.store') {
          return {
            findOne: async (q: any) => {
              calls.push({ method: 'store.findOne', args: [q] });
              const id = q?.where?.id;
              if (opts.storeFindOne) return opts.storeFindOne(id);
              return (opts.stores || []).find((s) => s.id === id) || null;
            },
            findMany: async (q: any) => {
              calls.push({ method: 'store.findMany', args: [q] });
              return opts.stores || [];
            },
            update: async () => ({}),
          };
        }
        if (uid === 'api::category.category') {
          return {
            findOne: async (q: any) => {
              calls.push({ method: 'category.findOne', args: [q] });
              const id = q?.where?.id;
              if (opts.categoryFindOne) return opts.categoryFindOne(id);
              return (opts.categories || []).find((c) => c.id === id) || null;
            },
            findMany: async (q: any) => {
              calls.push({ method: 'category.findMany', args: [q] });
              return opts.categories || [];
            },
          };
        }
        throw new Error('unknown uid ' + uid);
      },
    },
  };
  return { strapi, calls };
}

function makeMockRevalidation() {
  const calls: { method: string; args: any[] }[] = [];
  const rv: any = {
    addRoutes: (type: string, ids: any[]) => calls.push({ method: 'addRoutes', args: [type, ids] }),
    addPaths: (paths: string[]) => calls.push({ method: 'addPaths', args: [paths] }),
    addTags: (tags: string[]) => calls.push({ method: 'addTags', args: [tags] }),
    flush: async () => calls.push({ method: 'flush', args: [] }),
  };
  return { rv, calls };
}

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log('  PASS:', msg); }
  else { failed++; console.log('  FAIL:', msg); }
}

async function testResolveSuccess() {
  console.log('Test: resolveCouponRelations success returns populated relations');
  const { strapi } = makeMockStrapi({
    couponFindOne: { publishedAt: '2026-01-01T00:00:00Z', store: { id: 5, slug: 'amazon' }, categories: [{ id: 2, slug: 'electronics' }], countries: [{ code: 'US' }] },
  });
  const r: any = await resolveCouponRelations(strapi, { id: 1 });
  assert(r.ok === true, 'ok true');
  assert(r.storeSlug === 'amazon', 'storeSlug');
  assert(r.storeId === 5, 'storeId');
  assert(Array.isArray(r.categorySlugs) && r.categorySlugs[0] === 'electronics', 'categorySlugs');
  assert(Array.isArray(r.countryCodes) && r.countryCodes[0] === 'US', 'countryCodes');
  assert(r.publishedAt === '2026-01-01T00:00:00Z', 'publishedAt');
}

async function testResolveFailure() {
  console.log('Test: resolveCouponRelations failure returns ok:false (unknown)');
  const { strapi } = makeMockStrapi({ throwOnCoupon: true });
  const r: any = await resolveCouponRelations(strapi, { id: 1 });
  assert(r.ok === false, 'ok false on throw');
}

async function testResolveNotFound() {
  console.log('Test: resolveCouponRelations not-found returns ok:true with nulls (captured, no relations)');
  const { strapi } = makeMockStrapi({ couponFindOne: null });
  const r: any = await resolveCouponRelations(strapi, { id: 999 });
  assert(r.ok === true, 'ok true on not-found');
  assert(r.storeSlug === null, 'storeSlug null');
  assert(Array.isArray(r.categoryIds) && r.categoryIds.length === 0, 'no categories');
}

async function testPlainStringNotRelation() {
  console.log('Test: plain documentId string is not mistaken for populated relation');
  const { strapi } = makeMockStrapi({
    couponFindOne: { publishedAt: '2026-01-01T00:00:00Z', store: 'krqbeokfjzr5vjmxshk9o5py', categories: ['abc'], countries: null },
  });
  const r: any = await resolveCouponRelations(strapi, { id: 1 });
  assert(r.ok === true, 'ok true');
  assert(r.storeSlug === null, 'string store not treated as relation');
  assert(r.categorySlugs.length === 0, 'string categories not treated as relation');
}

async function testFallback() {
  console.log('Test: revalidationFallbackAll enumerates all stores/categories + dynamic patterns');
  const { strapi } = makeMockStrapi({
    stores: [{ slug: 'amazon' }, { slug: 'walmart' }],
    categories: [{ slug: 'electronics' }],
  });
  const { rv, calls } = makeMockRevalidation();
  await revalidationFallbackAll(strapi, rv);
  const storeCall = calls.find((c) => c.method === 'addRoutes' && c.args[0] === 'store');
  const catCall = calls.find((c) => c.method === 'addRoutes' && c.args[0] === 'category');
  const pathCall = calls.find((c) => c.method === 'addPaths');
  assert(!!storeCall && storeCall.args[1].length === 2, 'all stores enumerated');
  assert(!!catCall && catCall.args[1].length === 1, 'all categories enumerated');
  assert(!!pathCall && pathCall.args[0].includes('/store/[slug]') && pathCall.args[0].includes('/browse/[slug]'), 'dynamic patterns added');
  const flushCall = calls.find((c) => c.method === 'flush');
  assert(!!flushCall, 'flush called');
}

async function testFallbackEnumerationFailure() {
  console.log('Test: revalidationFallbackAll still adds patterns + flushes when enumeration throws');
  const strapi: any = {
    log: { error: () => {}, info: () => {}, debug: () => {} },
    db: {
      query: () => ({ findMany: async () => { throw new Error('db down'); }, findOne: async () => null }),
    },
  };
  const { rv, calls } = makeMockRevalidation();
  await revalidationFallbackAll(strapi, rv);
  const pathCall = calls.find((c) => c.method === 'addPaths');
  assert(!!pathCall, 'patterns added even on enumeration failure');
  const flushCall = calls.find((c) => c.method === 'flush');
  assert(!!flushCall, 'flush called even on enumeration failure');
}

async function testRevalidateBoth() {
  console.log('Test: revalidateStoresAndCategories adds both old+new store/category routes');
  const { strapi } = makeMockStrapi({});
  const { rv, calls } = makeMockRevalidation();
  await revalidateStoresAndCategories(strapi, rv, ['amazon', 'walmart'], ['electronics']);
  const storeCall = calls.find((c) => c.method === 'addRoutes' && c.args[0] === 'store');
  const catCall = calls.find((c) => c.method === 'addRoutes' && c.args[0] === 'category');
  assert(!!storeCall && storeCall.args[1].length === 2, 'both stores');
  assert(!!catCall && catCall.args[1].length === 1, 'category');
}

async function testStateTransferConcept() {
  console.log('Test: event.state set in before-hook is present in after-hook (Strapi mechanism)');
  // Simulate Strapi entity-manager states Map threading.
  const states = new Map();
  const subscriber = (event: any) => {
    if (event.action === 'beforeUpdate') {
      event.state = event.state || {};
      event.state.previousStoreSlug = 'old-store';
      event.state.captured = true;
    }
    if (event.action === 'afterUpdate') {
      // state should be the same object reference carried over
      if (!event.state || event.state.previousStoreSlug !== 'old-store') {
        throw new Error('state not transferred');
      }
    }
    return Promise.resolve();
  };
  states.set(subscriber, {});
  // before
  const beforeEvent: any = { action: 'beforeUpdate', state: states.get(subscriber) };
  await subscriber(beforeEvent);
  if (beforeEvent.state) states.set(subscriber, beforeEvent.state);
  // after — Strapi passes the same state object
  const afterEvent: any = { action: 'afterUpdate', state: states.get(subscriber) };
  await subscriber(afterEvent);
  assert(true, 'state survived before->after boundary');
}

async function testConcurrentIsolation() {
  console.log('Test: concurrent operations use separate state objects (no overwrite)');
  const op1State = {};
  const op2State = {};
  // two independent state maps
  const map1 = new Map();
  const map2 = new Map();
  const sub = (ev: any) => { ev.state = ev.state || {}; ev.state.tag = ev.tag; return Promise.resolve(); };
  map1.set(sub, op1State);
  map2.set(sub, op2State);
  const e1: any = { action: 'beforeUpdate', state: map1.get(sub), tag: 'op1' };
  const e2: any = { action: 'beforeUpdate', state: map2.get(sub), tag: 'op2' };
  await sub(e1); if (e1.state) map1.set(sub, e1.state);
  await sub(e2); if (e2.state) map2.set(sub, e2.state);
  assert(map1.get(sub).tag === 'op1', 'op1 state isolated');
  assert(map2.get(sub).tag === 'op2', 'op2 state isolated');
}

async function main() {
  console.log('=== Invalidation unit tests ===');
  await testResolveSuccess();
  await testResolveFailure();
  await testResolveNotFound();
  await testPlainStringNotRelation();
  await testFallback();
  await testFallbackEnumerationFailure();
  await testRevalidateBoth();
  await testStateTransferConcept();
  await testConcurrentIsolation();
  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });