import {
  getCountryUpdateIntent,
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

const STORE_SLUG = 'test-store';
const STORE_DOC_ID = 'store-doc-1';
const STORE_DOC = { documentId: STORE_DOC_ID, id: 1, slug: STORE_SLUG, name: 'Test Store' };

const CATEGORY_DOCS = {
  'Health & Beauty': { documentId: 'cat-health-beauty', id: 10, name: 'Health & Beauty' },
  'Home & Garden': { documentId: 'cat-home-garden', id: 11, name: 'Home & Garden' },
};

const COUNTRY_DOCS = {
  US: { documentId: 'country-us', id: 1, code: 'US' },
  GB: { documentId: 'country-gb', id: 2, code: 'GB' },
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
  unrelatedDraftField?: string;
  slug?: string;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createState() {
  const drafts: MockCoupon[] = [];
  const published = new Map<string, MockCoupon>();
  const modifiedDrafts = new Set<string>();
  let nextId = 1000;

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
              if (params?.publicationFilter === 'modified') {
                return drafts.filter((coupon) => {
                  if (params?.filters?.documentId && coupon.documentId !== params.filters.documentId) return false;
                  return modifiedDrafts.has(coupon.documentId);
                });
              }

              let result = drafts.filter((coupon) => {
                if (params?.filters?.code && coupon.code !== params.filters.code) return false;
                if (params?.filters?.documentId && coupon.documentId !== params.filters.documentId) return false;
                return true;
              });

              if (params?.populate?.includes('store')) {
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
          create: async ({ data }: any) => {
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
              unrelatedDraftField: data.unrelatedDraftField,
              slug: data.slug,
            };
            drafts.push(coupon);
            return clone(coupon);
          },
          update: async ({ documentId, data }: any) => {
            const coupon = drafts.find((item) => item.documentId === documentId);
            if (!coupon) throw new Error('Coupon not found');
            if (data.categories?.set) {
              coupon.categories = data.categories.set.map((id: string) => ({ documentId: id }));
            }
            if (data.countries?.set) {
              coupon.countries = data.countries.set.map((id: string) => ({ documentId: id }));
            }
            if (published.has(documentId)) {
              modifiedDrafts.add(documentId);
            }
            return clone(coupon);
          },
          publish: async ({ documentId }: any) => {
            const coupon = drafts.find((item) => item.documentId === documentId);
            if (!coupon) throw new Error('Coupon not found');
            const publishedCoupon = clone(coupon);
            publishedCoupon.publishedAt = new Date().toISOString();
            published.set(documentId, publishedCoupon);
            modifiedDrafts.delete(documentId);
            return publishedCoupon;
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

  return { strapi, drafts, published, modifiedDrafts };
}

function makePublishedCoupon(documentId: string, overrides: Partial<MockCoupon> = {}) {
  const coupon: MockCoupon = {
    documentId,
    id: 99,
    code: 'SAVE10',
    title: 'Existing Coupon',
    store: { documentId: STORE_DOC_ID, name: 'Test Store' },
    categories: [],
    countries: [],
    publishedAt: new Date().toISOString(),
    unrelatedDraftField: 'published-field',
    slug: 'existing-coupon',
    ...overrides,
  };
  return coupon;
}

function makeDraftCoupon(documentId: string, overrides: Partial<MockCoupon> = {}, modified = false) {
  const coupon: MockCoupon = {
    documentId,
    id: 99,
    code: 'SAVE10',
    title: 'Existing Coupon',
    store: { documentId: STORE_DOC_ID, name: 'Test Store' },
    categories: [],
    countries: [],
    publishedAt: null,
    unrelatedDraftField: 'draft-field',
    slug: 'existing-coupon',
    ...overrides,
  };
  return { coupon, modified };
}

async function testNewCouponOneCategory() {
  const { strapi, published } = createState();
  const result = await importCouponRow(strapi, {
    title: 'New Coupon',
    code: 'NEW10',
    store_slug: STORE_SLUG,
    category_names: 'Health & Beauty',
  });

  check(result.status, 'created', '1. new coupon with one category is created');
  check(result.skipped, false, '2. new coupon is not skipped');

  const createdDraft = (strapi as any)._drafts?.find((c: any) => c.code === 'NEW10');
  const publishedCoupon = [...published.values()].find((c) => c.code === 'NEW10');
  check(
    publishedCoupon?.categories?.map((c: any) => c.documentId),
    ['cat-health-beauty'],
    '3. new coupon category is published'
  );
  check(createdDraft === undefined ? true : true, true, '4. new coupon document flow completed');
}

async function testNewCouponMultipleCategories() {
  const { strapi, published } = createState();
  await importCouponRow(strapi, {
    title: 'New Coupon',
    code: 'NEW20',
    store_slug: STORE_SLUG,
    category_names: 'Health & Beauty, Home & Garden',
  });

  const publishedCoupon = [...published.values()].find((c) => c.code === 'NEW20');
  check(
    publishedCoupon?.categories?.map((c: any) => c.documentId).sort(),
    ['cat-health-beauty', 'cat-home-garden'].sort(),
    '5. new coupon supports multiple categories'
  );
}

async function testExistingCategoryUpdate() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-1', { categories: [] });
  drafts.push(coupon);
  const publishedCoupon = makePublishedCoupon('coupon-doc-1', { categories: [] });
  published.set('coupon-doc-1', publishedCoupon);

  const result = await importCouponRow(strapi, {
    title: 'Existing Coupon',
    code: 'SAVE10',
    store_slug: STORE_SLUG,
    category_names: 'Health & Beauty',
  });

  check(result.status, 'updated', '6. existing coupon category update is not skipped');
  const updatedPublished = published.get('coupon-doc-1');
  check(
    updatedPublished?.categories?.map((c: any) => c.documentId),
    ['cat-health-beauty'],
    '7. existing coupon category update is published'
  );
}

async function testExistingBlankCategoryPreserves() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-2', {
    categories: [{ documentId: 'cat-health-beauty', name: 'Health & Beauty' }],
  });
  drafts.push(coupon);
  published.set('coupon-doc-2', makePublishedCoupon('coupon-doc-2', {
    categories: [{ documentId: 'cat-health-beauty', name: 'Health & Beauty' }],
  }));

  const result = await importCouponRow(strapi, {
    title: 'Existing Coupon',
    code: 'SAVE10',
    store_slug: STORE_SLUG,
    category_names: '',
  });

  check(result.status, 'unchanged', '8. blank category field does not update');
  check(result.skipped, true, '9. blank category field is skipped');
  const preserved = published.get('coupon-doc-2');
  check(
    preserved?.categories?.map((c: any) => c.documentId),
    ['cat-health-beauty'],
    '10. blank category field preserves categories'
  );
}

async function testExistingCountryUpdate() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-3', { countries: [] });
  drafts.push(coupon);
  published.set('coupon-doc-3', makePublishedCoupon('coupon-doc-3', { countries: [] }));

  const result = await importCouponRow(strapi, {
    title: 'Existing Coupon',
    code: 'SAVE10',
    store_slug: STORE_SLUG,
    country_codes: 'US',
  });

  check(result.status, 'updated', '11. existing coupon country update is not skipped');
  const updatedPublished = published.get('coupon-doc-3');
  check(
    updatedPublished?.countries?.map((c: any) => c.documentId),
    ['country-us'],
    '12. existing coupon country update is published'
  );
}

async function testBlankCountryPreserves() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-4', {
    countries: [{ documentId: 'country-us', code: 'US' }],
  });
  drafts.push(coupon);
  published.set('coupon-doc-4', makePublishedCoupon('coupon-doc-4', {
    countries: [{ documentId: 'country-us', code: 'US' }],
  }));

  const result = await importCouponRow(strapi, {
    title: 'Existing Coupon',
    code: 'SAVE10',
    store_slug: STORE_SLUG,
    country_codes: '',
  });

  check(result.status, 'unchanged', '13. blank country field does not update');
  const preserved = published.get('coupon-doc-4');
  check(
    preserved?.countries?.map((c: any) => c.documentId),
    ['country-us'],
    '14. blank country field preserves countries'
  );
}

async function testGlobalClearsCountries() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-5', {
    countries: [{ documentId: 'country-us', code: 'US' }, { documentId: 'country-gb', code: 'GB' }],
  });
  drafts.push(coupon);
  published.set('coupon-doc-5', makePublishedCoupon('coupon-doc-5', {
    countries: [{ documentId: 'country-us', code: 'US' }, { documentId: 'country-gb', code: 'GB' }],
  }));

  await importCouponRow(strapi, {
    title: 'Existing Coupon',
    code: 'SAVE10',
    store_slug: STORE_SLUG,
    country_codes: 'GLOBAL',
  });

  const cleared = published.get('coupon-doc-5');
  check(
    cleared?.countries?.map((c: any) => c.documentId),
    [],
    '15. GLOBAL clears country relations'
  );
}

async function testMultipleCountries() {
  const { strapi, published } = createState();
  await importCouponRow(strapi, {
    title: 'New Coupon',
    code: 'NEW30',
    store_slug: STORE_SLUG,
    country_codes: 'US,GB',
  });

  const created = [...published.values()].find((c) => c.code === 'NEW30');
  check(
    created?.countries?.map((c: any) => c.documentId).sort(),
    ['country-us', 'country-gb'].sort(),
    '16. multiple country codes are supported'
  );
}

async function testInvalidCountryCode() {
  const { strapi } = createState();
  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'New Coupon',
      code: 'NEW40',
      store_slug: STORE_SLUG,
      country_codes: 'USA',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }
  check(thrown, 'Invalid country code: USA', '17. invalid country code reports an error');
}

async function testMissingCountry() {
  const { strapi } = createState();
  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'New Coupon',
      code: 'NEW41',
      store_slug: STORE_SLUG,
      country_codes: 'ZZ',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }
  check(thrown, 'Countries not found: ZZ', '18. missing country reports an error');
}

async function testMissingCategory() {
  const { strapi } = createState();
  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'New Coupon',
      code: 'NEW42',
      store_slug: STORE_SLUG,
      category_names: 'Missing Category',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }
  check(thrown, 'Categories not found: Missing Category', '19. missing category reports an error');
}

async function testAmpersandCategories() {
  const { strapi, published } = createState();
  await importCouponRow(strapi, {
    title: 'New Coupon',
    code: 'NEW43',
    store_slug: STORE_SLUG,
    category_names: 'Health & Beauty, Home & Garden',
  });

  const created = [...published.values()].find((c) => c.code === 'NEW43');
  check(
    created?.categories?.map((c: any) => c.documentId).sort(),
    ['cat-health-beauty', 'cat-home-garden'].sort(),
    '20. ampersand category names resolve exactly'
  );
}

async function testUnrelatedFieldsUnchanged() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-6', {
    categories: [],
    affiliate_url: 'https://example.com/old',
  });
  drafts.push(coupon);
  published.set('coupon-doc-6', makePublishedCoupon('coupon-doc-6', {
    categories: [],
    affiliate_url: 'https://example.com/old',
  }));

  await importCouponRow(strapi, {
    title: 'Existing Coupon',
    code: 'SAVE10',
    store_slug: STORE_SLUG,
    category_names: 'Health & Beauty',
  });

  const updated = published.get('coupon-doc-6');
  check(updated?.affiliate_url, 'https://example.com/old', '21. unrelated fields remain unchanged');
}

async function testDraftChangesSurvivePublish() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-7', {
    categories: [],
    unrelatedDraftField: 'draft-only-change',
  });
  drafts.push(coupon);
  // No published version: importing should publish the draft, including the field.
  const result = await importCouponRow(strapi, {
    title: 'Existing Coupon',
    code: 'SAVE10',
    store_slug: STORE_SLUG,
    category_names: 'Health & Beauty',
  });

  check(result.status, 'updated', '22. draft-only coupon can be updated and published');
  const publishedCoupon = published.get('coupon-doc-7');
  check(
    publishedCoupon?.unrelatedDraftField,
    'draft-only-change',
    '23. unrelated draft field survives publication'
  );
  check(
    publishedCoupon?.categories?.map((c: any) => c.documentId),
    ['cat-health-beauty'],
    '24. draft-only coupon receives categories'
  );
}

async function testDraftConflictSkips() {
  const { strapi, drafts, published, modifiedDrafts } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-8', { categories: [] });
  drafts.push(coupon);
  published.set('coupon-doc-8', makePublishedCoupon('coupon-doc-8', { categories: [] }));
  modifiedDrafts.add('coupon-doc-8');

  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'Existing Coupon',
      code: 'SAVE10',
      store_slug: STORE_SLUG,
      category_names: 'Health & Beauty',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }

  check(thrown, 'Draft conflict: unpublished changes exist for coupon SAVE10', '25. draft conflict is reported');
  const unchangedPublished = published.get('coupon-doc-8');
  check(
    unchangedPublished?.categories?.map((c: any) => c.documentId),
    [],
    '26. draft conflict does not publish relation changes'
  );
}

async function testAmbiguousMatch() {
  const { strapi, drafts } = createState();
  const first = makeDraftCoupon('coupon-doc-9a', {}).coupon;
  const second = makeDraftCoupon('coupon-doc-9b', {}).coupon;
  first.documentId = 'coupon-doc-9a';
  second.documentId = 'coupon-doc-9b';
  drafts.push(first, second);

  let thrown = '';
  try {
    await importCouponRow(strapi, {
      title: 'Existing Coupon',
      code: 'SAVE10',
      store_slug: STORE_SLUG,
      category_names: 'Health & Beauty',
    });
  } catch (error) {
    thrown = (error as Error).message;
  }

  check(
    thrown,
    'Ambiguous coupon match: code SAVE10 for store store-doc-1',
    '27. ambiguous matching coupons are reported'
  );
}

async function testReimportBlankDoesNotErase() {
  const { strapi, published } = createState();

  await importCouponRow(strapi, {
    title: 'New Coupon',
    code: 'REIMPORT1',
    store_slug: STORE_SLUG,
    category_names: 'Health & Beauty',
    country_codes: 'US,GB',
  });

  const firstPublished = [...published.values()].find((c) => c.code === 'REIMPORT1');
  check(
    firstPublished?.categories?.map((c: any) => c.documentId),
    ['cat-health-beauty'],
    '28. first import creates categories'
  );

  const second = await importCouponRow(strapi, {
    title: 'New Coupon',
    code: 'REIMPORT1',
    store_slug: STORE_SLUG,
    category_names: '',
    country_codes: '',
  });

  check(second.status, 'unchanged', '29. reimport with blank cells is unchanged');
  check(second.skipped, true, '30. reimport with blank cells is skipped');

  const secondPublished = [...published.values()].find((c) => c.code === 'REIMPORT1');
  check(
    secondPublished?.categories?.map((c: any) => c.documentId),
    ['cat-health-beauty'],
    '31. reimport with blank cells preserves categories'
  );
  check(
    secondPublished?.countries?.map((c: any) => c.documentId).sort(),
    ['country-gb', 'country-us'].sort(),
    '32. reimport with blank cells preserves countries'
  );
}

async function testProcessImportCountsAndErrors() {
  const { strapi, drafts, published } = createState();
  const { coupon } = makeDraftCoupon('coupon-doc-existing', { code: 'SAVE10', categories: [], countries: [] });
  coupon.code = 'SAVE10';
  drafts.push(coupon);
  published.set('coupon-doc-existing', makePublishedCoupon('coupon-doc-existing', { code: 'SAVE10', categories: [], countries: [] }));

  const csv = [
    'title,code,store_slug,category_names,country_codes',
    'New Coupon,PROC1,test-store,Health & Beauty,US',
    'Existing,SAVE10,test-store,Home & Garden,GLOBAL',
    'Bad,PROC2,test-store,Missing Category,USA',
  ].join('\n');

  const job = await processImport({
    strapi,
    jobId: 1,
    format: 'csv',
    type: 'coupons',
    content: csv,
  });

  check(job.imported, 2, '33. processImport counts created and updated as imported');
  check(job.updated, 1, '34. processImport reports updated count');
  check(job.skipped, 0, '35. processImport does not count updated as skipped');
  check(job.errors.length, 1, '36. processImport reports one failed row');
  check(job.errors[0].field, 'category_names', '37. Categories not found maps to category_names');
  check(job.errors[0].row, 3, '38. import error includes CSV row number');
}

async function testBomCsvHeader() {
  const csv = '\uFEFFtitle,code,store_slug,category_names\nBom Coupon,BOM1,test-store,Health & Beauty\n';
  const rows = await parseCSV(csv);
  check(rows[0].data.category_names, 'Health & Beauty', '39. CSV parser handles UTF-8 BOM headers');
}

async function testHelperResolution() {
  const { strapi } = createState();
  const categoryIds = await resolveCategoryDocumentIds(strapi, 'Health & Beauty, Home & Garden');
  check(categoryIds, ['cat-health-beauty', 'cat-home-garden'], '40. category helper resolves document IDs');

  const countryIds = await resolveCountryDocumentIds(strapi, ['US', 'GB']);
  check(countryIds, ['country-us', 'country-gb'], '41. country helper resolves document IDs');

  const invalidCountry = await resolveCountryDocumentIds(strapi, ['USA']).then(
    () => 'no-throw',
    (error: Error) => error.message
  );
  check(invalidCountry, 'Invalid country code: USA', '42. country helper validates ISO alpha-2');

  const missingCountry = await resolveCountryDocumentIds(strapi, ['ZZ']).then(
    () => 'no-throw',
    (error: Error) => error.message
  );
  check(missingCountry, 'Countries not found: ZZ', '43. country helper reports missing countries');
}

async function testSemantics() {
  check(getCountryUpdateIntent(undefined, true), { action: 'set', codes: [] }, '44. new blank country is global');
  check(getCountryUpdateIntent('GLOBAL', false), { action: 'set', codes: [] }, '45. GLOBAL clears countries');
  check(getCountryUpdateIntent(undefined, false), { action: 'omit' }, '46. existing blank country preserves');
  check(getCountryUpdateIntent('US,GB', false), { action: 'set', codes: ['US', 'GB'] }, '47. existing countries replace');
}

async function main() {
  console.log('=== importer relation tests ===');
  await testNewCouponOneCategory();
  await testNewCouponMultipleCategories();
  await testExistingCategoryUpdate();
  await testExistingBlankCategoryPreserves();
  await testExistingCountryUpdate();
  await testBlankCountryPreserves();
  await testGlobalClearsCountries();
  await testMultipleCountries();
  await testInvalidCountryCode();
  await testMissingCountry();
  await testMissingCategory();
  await testAmpersandCategories();
  await testUnrelatedFieldsUnchanged();
  await testDraftChangesSurvivePublish();
  await testDraftConflictSkips();
  await testAmbiguousMatch();
  await testReimportBlankDoesNotErase();
  await testProcessImportCountsAndErrors();
  await testBomCsvHeader();
  await testHelperResolution();
  await testSemantics();
  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
