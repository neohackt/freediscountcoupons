import schema from './content-types/event/schema.json';

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

type Attributes = Record<string, Record<string, unknown>>;

async function main() {
  console.log('=== event schema Tests ===');

  const attributes = schema.attributes as Attributes;
  const keys = Object.keys(attributes).sort();
  check(
    keys,
    [
      'content',
      'heroImage',
      'isActive',
      'name',
      'ogImage',
      'seoDescription',
      'seoTitle',
      'shortDescription',
      'slug',
      'sortOrder',
      'stores',
    ].sort(),
    'schema contains exactly the specified fields (no coupon/country relations)'
  );

  check(
    (attributes.name as Record<string, unknown>).required,
    true,
    'name is required'
  );
  check(
    (attributes.slug as Record<string, unknown>).required,
    true,
    'slug is required'
  );
  check(
    (attributes.slug as Record<string, unknown>).unique !== false,
    true,
    'slug is unique (uid type)'
  );
  check(
    (attributes.isActive as Record<string, unknown>).default,
    false,
    'isActive defaults to false'
  );
  check(
    (attributes.sortOrder as Record<string, unknown>).default,
    0,
    'sortOrder defaults to 0'
  );

  const stores = attributes.stores as Record<string, unknown>;
  check(stores.type, 'relation', 'stores is a relation');
  check(stores.relation, 'manyToMany', 'stores is many-to-many');
  check(stores.target, 'api::store.store', 'stores targets the Store type');
  check('inversedBy' in stores || 'mappedBy' in stores, false, 'no inverse side (Store schema untouched)');

  const heroImage = attributes.heroImage as Record<string, unknown>;
  check(heroImage.type, 'media', 'heroImage is media');
  check(heroImage.multiple, false, 'heroImage is single');

  console.log(`\n=== Done: ${failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`} ===`);
  if (failures > 0) process.exit(1);
}

void main();
