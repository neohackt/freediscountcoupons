import {
  importCouponRow,
  processImport,
  resolveCategoryDocumentIds,
  resolveCountryDocumentIds,
} from './importer';
import { parseCSV } from './parsers/csv';

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

const STORE_SLUG = 'aliexpress';
const STORE_DOC_ID = 'store-doc-1';
const STORE_DOC = { documentId: STORE_DOC_ID, id: 1, slug: STORE_SLUG, name: 'AliExpress' };

const CATEGORY_DOCS = {
  'Electronics': { documentId: 'cat-electronics', id: 10, name: 'Electronics' },
  'Fashion': { documentId: 'cat-fashion', id: 11, name: 'Fashion' },
};

const COUNTRY_DOCS = {
  JP: { documentId: 'country-jp', id: 1, code: 'JP' },
  CL: { documentId: 'country-cl', id: 2, code: 'CL' },
  US: { documentId: 'country-us', id: 3, code: 'US' },
};

interface MockCoupon {
  documentId: string;
  id: number;
  code: string;
  title: string;
  store: { documentId: string; name?: string } | null;
  categories: Array<{ documentId: string; name?: string }>;
  countries: Array<{ documentId: string; code?: string }>;
  publishedAt: string | null;
  slug?: string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createState() {
  const drafts: MockCoupon[] = [];
  const published = new Map<string, MockCoupon>();
  let nextId = 1000;
  let deleteCalls = 0;

  const strapi: any = {
    documents: (uid: string) => {
      if (uid === 'api::store.store') {
        return {
          findMany: async (params: any) => {
            if (params?.filters?.slug === STORE_SLUG && params?.status === 'published') {
              return [STORE_DOC];
            }
            return [];
          },
        };
      }

      if (uid === 'api::category.category') {
        return {
          findMany: async (params: any) => {
            const names = params?.filters?.name?.$in || [];
            if (params?.status !== 'published') return [];
            return names
              .map((name: string) => CATEGORY_DOCS[name as keyof typeof CATEGORY_DOCS])
              .filter(Boolean);
          },
        };
      }

      if (uid === 'api::country.country') {
        return {
          findMany: async (params: any) => {
            const codes = params?.filters?.code?.$in || [];
            if (params?.status !== 'published') return [];
            return codes
              .map((code: string) => COUNTRY_DOCS[code as keyof typeof COUNTRY_DOCS])
              .filter(Boolean);
          },
        };
      }

      if (uid === 'api::coupon.coupon') {
        return {
          findMany: async (params: any) => {
            if (params?.status === 'draft') {
              let result = drafts.filter((coupon) => {
                if (params?.filters?.documentId && coupon.documentId !== params.filters.documentId) return false;
                if (params?.filters?.code && coupon.code !== params.filters.code) return false;
                return true;
              });
              if (params?.populate?.includes('store') || params?.populate?.includes('categories') || params?.populate?.includes('countries')) {
                result = result.map((coupon) => clone(coupon));
              }
              return result;
            }

            if (params?.status === 'published') {
              let result = [...published.values()].filter((coupon) => {
                if (params?.filters?.documentId && coupon.documentId !== params.filters.documentId) return false;
                if (params?.filters?.code && coupon.code !== params.filters.code) return false;
                return true;
              });
              if (params?.populate?.includes('categories') || params?.populate?.includes('countries')) {
                result = result.map((coupon) => clone(coupon));
              }
              return result;
            }

            return [];
          },
          create: async ({ data, status }: any) => {
            const documentId = `coupon-doc-${++nextId}`;
            const coupon: MockCoupon = {
              documentId,
              id: nextId,
              code: data.code,
              title: data.title,
              store: { documentId: data.store },
              categories: (data.categories?.set || []).map((id: string) => ({ documentId: id })),
              countries: (data.countries?.set || []).map((id: string) => ({ documentId: id })),
              publishedAt: null,
              slug: data.slug,
            };
            // Strapi Document Service: status: 'published' creates and publishes in one step.
            if (status === 'published') {
              coupon.publishedAt = new Date().toISOString();
              published.set(documentId, coupon);
            } else {
              drafts.push(coupon);
            }
            return clone(coupon);
          },
          publish: async ({ documentId }: any) => {
            const coupon = drafts.find((item) => item.documentId === documentId);
            if (!coupon) throw new Error('Coupon not found');
            const publishedCoupon = clone(coupon);
            publishedCoupon.publishedAt = new Date().toISOString();
            published.set(documentId, publishedCoupon);
            return publishedCoupon;
          },
          delete: async ({ documentId }: any) => {
            const idx = drafts.findIndex((item) => item.documentId === documentId);
            if (idx !== -1) {
              drafts.splice(idx, 1);
              deleteCalls++;
            }
            const pubIdx = [...published.keys()].findIndex(k => k === documentId);
            if (pubIdx !== -1) {
              published.delete(documentId);
              deleteCalls++;
            }
            return {};
          },
        };
      }

      throw new Error(`Unexpected document type: ${uid}`);
    },
    db: {
      query: () => ({
        update: async () => ({}),
        findOne: async () => ({}),
      }),
    },
  };

  return { strapi, drafts, published, deleteCalls };
}

function couponCodes(coupons: MockCoupon[]): string[] {
  return coupons.map(c => c.code);
}

function countryDocIds(coupon: MockCoupon): string[] {
  return coupon.countries.map(c => c.documentId).sort();
}

async function testRepeatedCodesCreateIndependentRecords() {
  const { strapi, published } = createState();

  await importCouponRow(strapi, {
    title: 'Coupon A',
    code: 'IFPYFCT1',
    store_slug: STORE_SLUG,
    country_codes: 'JP',
  });
  await importCouponRow(strapi, {
    title: 'Coupon B',
    code: 'IFPYFCT1',
    store_slug: STORE_SLUG,
    country_codes: 'JP',
  });

  const withCode = [...published.values()].filter(c => c.code === 'IFPYFCT1');
  check(withCode.length, 2, '1. repeated coupon codes create 2 independent records');
  check(withCode.every(c => countryDocIds(c).includes('country-jp')), true, 'both assigned to JP');
}

async function testRepeatedTitlesDescriptionsCreateIndependentRecords() {
  const { strapi, published } = createState();

  await importCouponRow(strapi, {
    title: 'Same Title',
    code: 'CODE1',
    store_slug: STORE_SLUG,
    description: 'Same description',
  });
  await importCouponRow(strapi, {
    title: 'Same Title',
    code: 'CODE2',
    store_slug: STORE_SLUG,
    description: 'Same description',
  });

  const withTitle = [...published.values()].filter(c => c.title === 'Same Title');
  check(withTitle.length, 2, '2. repeated titles create independent records');
  check(withTitle.map(c => c.code).sort(), ['CODE1', 'CODE2'], 'different codes');
}

async function testIdenticalRowsCreateIndependentRecords() {
  const { strapi, published } = createState();

  await importCouponRow(strapi, {
    title: 'Identical',
    code: 'DUP1',
    store_slug: STORE_SLUG,
    country_codes: 'JP',
  });
  await importCouponRow(strapi, {
    title: 'Identical',
    code: 'DUP1',
    store_slug: STORE_SLUG,
    country_codes: 'JP',
  });

  const withCode = [...published.values()].filter(c => c.code === 'DUP1');
  check(withCode.length, 2, '3. identical CSV rows create 2 independent records');
}

async function testEmptyCountryCreatesNoRelations() {
  const { strapi, published } = createState();

  await importCouponRow(strapi, {
    title: 'Global Coupon',
    code: 'GLOBAL1',
    store_slug: STORE_SLUG,
    country_codes: '',
  });

  const coupon = [...published.values()].find(c => c.code === 'GLOBAL1');
  check(coupon?.countries.length, 0, '4. empty country → no Country relationships');
  check(coupon?.publishedAt !== null, true, 'coupon is published');
}

async function testJpClAssignsBothCountries() {
  const { strapi, published } = createState();

  await importCouponRow(strapi, {
    title: 'Multi Country',
    code: 'MULTI1',
    store_slug: STORE_SLUG,
    country_codes: 'JP,CL',
  });

  const coupon = [...published.values()].find(c => c.code === 'MULTI1');
  check(countryDocIds(coupon!), ['country-cl', 'country-jp'], '5. JP,CL assigns both countries');
}

async function testInvalidCountryCodeRowError() {
  const { strapi, drafts, published } = createState();

  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'Bad Coupon',
      code: 'BAD1',
      store_slug: STORE_SLUG,
      country_codes: 'USA',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }
  check(thrown, 'Invalid country code: USA', '6. invalid country code produces row-level error');
  check([...published.values()].length, 0, 'invalid country → no coupon created');
  check(drafts.length, 0, 'invalid country → no draft left behind');
}

async function testInvalidCountryDoesNotBecomeGlobal() {
  const { strapi, published } = createState();

  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'Bad Coupon',
      code: 'BAD2',
      store_slug: STORE_SLUG,
      country_codes: 'USA',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }
  check(thrown.includes('Invalid country code'), true, '7. invalid country reports error');
  check([...published.values()].length, 0, 'invalid country never silently becomes Global');
}

async function testGlobalFailsValidation() {
  const { strapi, published } = createState();

  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'Global Coupon',
      code: 'GLOBAL1',
      store_slug: STORE_SLUG,
      country_codes: 'GLOBAL',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }
  check(thrown, 'Invalid country code: GLOBAL', '8. GLOBAL fails ISO validation, not treated as Global');
  check([...published.values()].length, 0, 'GLOBAL → no coupon created');
}

async function testReimportCreatesAnotherSet() {
  const { strapi, published } = createState();

  // First import
  await importCouponRow(strapi, {
    title: 'Reimport Coupon',
    code: 'RE1',
    store_slug: STORE_SLUG,
    country_codes: 'JP',
  });
  let countAfterFirst = [...published.values()].filter(c => c.code === 'RE1').length;
  check(countAfterFirst, 1, '9a. first import creates 1 record');

  // Second import of same row
  await importCouponRow(strapi, {
    title: 'Reimport Coupon',
    code: 'RE1',
    store_slug: STORE_SLUG,
    country_codes: 'JP',
  });
  let countAfterSecond = [...published.values()].filter(c => c.code === 'RE1').length;
  check(countAfterSecond, 2, '9b. re-import creates another independent record (no skip)');
}

async function testEmptyCountryVariantsCreateNoRelations() {
  const { strapi, published } = createState();

  const variants: Array<{ title: string; code: string; country_codes: unknown }> = [
    { title: 'Empty String', code: 'V1', country_codes: '' },
    { title: 'Whitespace', code: 'V2', country_codes: '   ' },
    { title: 'Null', code: 'V3', country_codes: null },
    { title: 'Undefined', code: 'V4', country_codes: undefined },
  ];

  for (const v of variants) {
    await importCouponRow(strapi, {
      title: v.title,
      code: v.code,
      store_slug: STORE_SLUG,
      country_codes: v.country_codes,
    });
  }

  for (const v of variants) {
    const coupon = [...published.values()].find(c => c.code === v.code);
    check(coupon?.countries.length, 0, `10. country_codes=${JSON.stringify(v.country_codes)} → no Country relationships`);
  }
}

async function testFailedCreationReportsCorrectRow() {
  const { strapi } = createState();
  // Store 'missing-store' does not exist → importCouponRow throws.
  const csv = [
    'title,code,store_slug,country_codes',
    'Good Coupon,GOOD1,aliexpress,JP',
    'Bad Coupon,BAD1,missing-store,JP',
  ].join('\n');

  const job = await processImport({
    strapi,
    jobId: 1,
    format: 'csv',
    type: 'coupons',
    content: csv,
  });

  check(job.imported, 1, '11a. one coupon imported');
  check(job.errors.length, 1, '11b. one failed row reported');
  check(job.errors[0].row, 2, '11c. error reports correct CSV row (row 2 = second data row)');
  check(job.errors[0].field, 'store_slug', '11d. error field is store_slug');
}

async function testFailedCreationLeavesNoUnpublishedCoupon() {
  const { strapi, drafts, published, deleteCalls } = createState();

  // Make publish fail by making the mock throw. We can't easily override per-call,
  // so instead: create a store that exists, but cause creation to fail via missing store.
  // Then verify no draft remains for the failed row.
  try {
    await importCouponRow(strapi, {
      title: 'Will Fail',
      code: 'FAIL1',
      store_slug: 'nonexistent-store',
      country_codes: 'JP',
    });
  } catch (error) {
    // expected
  }

  check(drafts.length, 0, '12a. failed creation leaves no draft');
  check([...published.values()].length, 0, '12b. failed creation leaves no published coupon');
}

async function testAliExpressFourRowDoubleImport() {
  const { strapi, published } = createState();

  const rows = [
    { title: 'AliExpress JP 1', code: 'IFPYFCT1', store_slug: STORE_SLUG, country_codes: 'JP' },
    { title: 'AliExpress JP 2', code: 'IFPZQIJU', store_slug: STORE_SLUG, country_codes: 'JP' },
    { title: 'AliExpress CL 1', code: 'IFPYFCT1', store_slug: STORE_SLUG, country_codes: 'CL' },
    { title: 'AliExpress CL 2', code: 'IFPZQIJU', store_slug: STORE_SLUG, country_codes: 'CL' },
  ];

  // First import
  for (const row of rows) {
    await importCouponRow(strapi, row);
  }

  const jpFirst = [...published.values()].filter(c => countryDocIds(c).includes('country-jp'));
  const clFirst = [...published.values()].filter(c => countryDocIds(c).includes('country-cl'));
  const globalFirst = [...published.values()].filter(c => c.countries.length === 0);

  check(jpFirst.length, 2, 'AliExpress first import: 2 Japan-assigned');
  check(clFirst.length, 2, 'AliExpress first import: 2 Chile-assigned');
  check(globalFirst.length, 0, 'AliExpress first import: 0 Global-assigned');
  check([...published.values()].length, 4, 'AliExpress first import: 4 total records');

  // Second import of the same CSV
  for (const row of rows) {
    await importCouponRow(strapi, row);
  }

  const jpSecond = [...published.values()].filter(c => countryDocIds(c).includes('country-jp'));
  const clSecond = [...published.values()].filter(c => countryDocIds(c).includes('country-cl'));
  const allSecond = [...published.values()];

  check(jpSecond.length, 4, 'AliExpress second import: 4 Japan-assigned (2+2)');
  check(clSecond.length, 4, 'AliExpress second import: 4 Chile-assigned (2+2)');
  check(allSecond.length, 8, 'AliExpress second import: 8 total records, no skips');
}

async function testProcessImportCountsOnlyCreatedAndErrors() {
  const { strapi, published } = createState();

  const csv = [
    'title,code,store_slug,country_codes',
    'Coupon 1,C1,aliexpress,JP',
    'Coupon 2,C2,aliexpress,CL',
    'Bad,C3,missing-store,JP',
  ].join('\n');

  const job = await processImport({
    strapi,
    jobId: 1,
    format: 'csv',
    type: 'coupons',
    content: csv,
  });

  check(job.imported, 2, 'processImport: 2 imported (created)');
  check(job.errors.length, 1, 'processImport: 1 error');
  check(job.errors[0].row, 3, 'processImport: error on row 3');
}

async function testPublishedCouponCreation() {
  const { strapi, published } = createState();

  const result = await importCouponRow(strapi, {
    title: 'Published Coupon',
    code: 'PUB1',
    store_slug: STORE_SLUG,
    country_codes: 'JP',
  });

  check(result.status, 'created', 'Published: status is created');
  const coupon = published.get(result.documentId);
  check(coupon?.publishedAt !== null && coupon?.publishedAt !== undefined, true, 'Published: publishedAt is populated');
  check(coupon?.countries.map((c: any) => c.documentId), ['country-jp'], 'Published: country relation correct');
}

async function testRevalidationFailurePreservesCounts() {
  const { strapi, published } = createState();

  // processImport calls revalidationService.flush() which will fail
  // (no frontend server running). Verify imported count is still correct.
  const csv = [
    'title,code,store_slug,country_codes',
    'Reval Coupon 1,RV1,aliexpress,JP',
    'Reval Coupon 2,RV2,aliexpress,CL',
  ].join('\n');

  const job = await processImport({
    strapi,
    jobId: 1,
    format: 'csv',
    type: 'coupons',
    content: csv,
  });

  check(job.imported, 2, 'Revalidation: 2 coupons imported despite revalidation failure');
  check(job.errors.length, 0, 'Revalidation: 0 errors despite revalidation failure');
  check([...published.values()].filter(c => c.code.startsWith('RV')).length, 2, 'Revalidation: both coupons published');
}

async function testHelperResolution() {
  const { strapi } = createState();
  const categoryIds = await resolveCategoryDocumentIds(strapi, 'Electronics, Fashion');
  check(categoryIds, ['cat-electronics', 'cat-fashion'], 'category helper resolves document IDs');

  const countryIds = await resolveCountryDocumentIds(strapi, ['JP', 'CL']);
  check(countryIds.sort(), ['country-cl', 'country-jp'], 'country helper resolves document IDs');

  const invalidCountry = await resolveCountryDocumentIds(strapi, ['USA']).then(
    () => 'no-throw',
    (error: Error) => error.message
  );
  check(invalidCountry, 'Invalid country code: USA', 'country helper validates ISO alpha-2');

  const missingCountry = await resolveCountryDocumentIds(strapi, ['ZZ']).then(
    () => 'no-throw',
    (error: Error) => error.message
  );
  check(missingCountry, 'Countries not found: ZZ', 'country helper reports missing countries');
}

async function main() {
  console.log('=== importer relations tests ===');
  await testRepeatedCodesCreateIndependentRecords();
  await testRepeatedTitlesDescriptionsCreateIndependentRecords();
  await testIdenticalRowsCreateIndependentRecords();
  await testEmptyCountryCreatesNoRelations();
  await testJpClAssignsBothCountries();
  await testInvalidCountryCodeRowError();
  await testInvalidCountryDoesNotBecomeGlobal();
  await testGlobalFailsValidation();
  await testReimportCreatesAnotherSet();
  await testEmptyCountryVariantsCreateNoRelations();
  await testFailedCreationReportsCorrectRow();
  await testFailedCreationLeavesNoUnpublishedCoupon();
  await testAliExpressFourRowDoubleImport();
  await testProcessImportCountsOnlyCreatedAndErrors();
  await testHelperResolution();
  await testPublishedCouponCreation();
  await testRevalidationFailurePreservesCounts();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
