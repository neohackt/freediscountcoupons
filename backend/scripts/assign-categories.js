const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', '.tmp', 'data.db'));

// Category name -> id mapping
const categories = {};
db.prepare('SELECT id, name, slug FROM categories').all().forEach(c => {
  categories[c.slug] = c;
});

console.log('Categories found:', Object.keys(categories).map(k => `${k} (id=${categories[k].id})`).join(', '));

// Store slug -> category slugs mapping
const storeCategoryMap = {
  'amazon': ['electronics', 'home-garden', 'health-beauty'],
  'bestbuy': ['electronics'],
  'walmart': ['electronics', 'home-garden', 'health-beauty'],
  'target': ['home-garden', 'fashion'],
  'nike': ['fashion', 'sports-outdoors'],
  'adidas': ['fashion', 'sports-outdoors'],
  'underarmour': ['fashion', 'sports-outdoors'],
  'barnesandnoble': ['books-media'],
  'sephora': ['health-beauty'],
  'bookingcom': ['travel'],
  'expedia': ['travel'],
  'ebay': ['electronics', 'fashion', 'home-garden'],
  'temu': ['electronics', 'fashion', 'home-garden'],
  'wayfair': ['home-garden'],
  'homedepot': ['home-garden'],
};

// Coupon title keyword -> category slug mapping (fallback for coupons without store mapping)
const couponCategoryKeywords = {
  'electronics': ['electronics', 'laptop', 'tech', 'gadget', 'tv', 'phone', 'computer', 'headphone'],
  'fashion': ['shoe', 'clothing', 'apparel', 'winter collection', 'running shoe', 'sale'],
  'health-beauty': ['skincare', 'health', 'vitamin', 'beauty', 'gift with purchase'],
  'books-media': ['book', 'media'],
  'travel': ['hotel', 'flight', 'car rental', 'booking', 'travel', 'vacation'],
  'home-garden': ['home', 'garden', 'furniture', 'kitchen'],
  'sports-outdoors': ['running', 'sport', 'fitness', 'outdoor'],
  'food-dining': ['food', 'restaurant', 'meal'],
};

// Get all stores with their slugs
const storeSlugToId = {};
db.prepare('SELECT id, slug FROM stores').all().forEach(s => {
  storeSlugToId[s.slug] = s.id;
});

console.log('Stores found:', Object.keys(storeSlugToId).join(', '));

// Get all coupons with their store
const coupons = db.prepare(`
  SELECT c.id, c.title, cs.store_id, s.slug as store_slug
  FROM coupons c
  LEFT JOIN coupons_store_lnk cs ON c.id = cs.coupon_id
  LEFT JOIN stores s ON cs.store_id = s.id
`).all();

console.log(`\nFound ${coupons.length} coupons`);

// Build store-category links
const insertStoreCat = db.prepare('INSERT INTO stores_categories_lnk (store_id, category_id) VALUES (?, ?)');
const insertCouponCat = db.prepare('INSERT INTO coupons_categories_lnk (coupon_id, category_id) VALUES (?, ?)');

// Check existing links
const existingStoreLinks = new Set();
db.prepare('SELECT store_id, category_id FROM stores_categories_lnk').all().forEach(r => {
  existingStoreLinks.add(`${r.store_id}-${r.category_id}`);
});

const existingCouponLinks = new Set();
db.prepare('SELECT coupon_id, category_id FROM coupons_categories_lnk').all().forEach(r => {
  existingCouponLinks.add(`${r.coupon_id}-${r.category_id}`);
});

let storeLinksAdded = 0;
let couponLinksAdded = 0;

// Step 1: Assign categories to stores
const assignStoreCategories = db.transaction(() => {
  for (const [storeSlug, catSlugs] of Object.entries(storeCategoryMap)) {
    const storeId = storeSlugToId[storeSlug];
    if (!storeId) {
      console.log(`  Store not found: ${storeSlug}`);
      continue;
    }

    for (const catSlug of catSlugs) {
      const cat = categories[catSlug];
      if (!cat) {
        console.log(`  Category not found: ${catSlug}`);
        continue;
      }

      const key = `${storeId}-${cat.id}`;
      if (!existingStoreLinks.has(key)) {
        insertStoreCat.run(storeId, cat.id);
        existingStoreLinks.add(key);
        storeLinksAdded++;
      }
    }
  }
});

// Step 2: Assign categories to coupons based on their store
const assignCouponCategories = db.transaction(() => {
  for (const coupon of coupons) {
    const assignedCats = new Set();

    // First, assign based on store mapping
    if (coupon.store_slug && storeCategoryMap[coupon.store_slug]) {
      for (const catSlug of storeCategoryMap[coupon.store_slug]) {
        const cat = categories[catSlug];
        if (cat && !assignedCats.has(cat.id)) {
          const key = `${coupon.id}-${cat.id}`;
          if (!existingCouponLinks.has(key)) {
            insertCouponCat.run(coupon.id, cat.id);
            existingCouponLinks.add(key);
            assignedCats.add(cat.id);
            couponLinksAdded++;
          }
        }
      }
    }

    // If no category assigned yet, try keyword matching
    if (assignedCats.size === 0) {
      const titleLower = (coupon.title || '').toLowerCase();
      for (const [catSlug, keywords] of Object.entries(couponCategoryKeywords)) {
        if (keywords.some(kw => titleLower.includes(kw))) {
          const cat = categories[catSlug];
          if (cat && !assignedCats.has(cat.id)) {
            const key = `${coupon.id}-${cat.id}`;
            if (!existingCouponLinks.has(key)) {
              insertCouponCat.run(coupon.id, cat.id);
              existingCouponLinks.add(key);
              assignedCats.add(cat.id);
              couponLinksAdded++;
            }
          }
        }
      }
    }
  }
});

assignStoreCategories();
assignCouponCategories();

console.log(`\nDone!`);
console.log(`  Store-category links added: ${storeLinksAdded}`);
console.log(`  Coupon-category links added: ${couponLinksAdded}`);

// Verify
const totalStoreLinks = db.prepare('SELECT COUNT(*) as c FROM stores_categories_lnk').get().c;
const totalCouponLinks = db.prepare('SELECT COUNT(*) as c FROM coupons_categories_lnk').get().c;
console.log(`\nTotal store-category links: ${totalStoreLinks}`);
console.log(`Total coupon-category links: ${totalCouponLinks}`);

// Show category distribution
console.log('\nCategory distribution (coupons):');
const dist = db.prepare(`
  SELECT c.name, COUNT(cl.coupon_id) as count
  FROM categories c
  LEFT JOIN coupons_categories_lnk cl ON c.id = cl.category_id
  GROUP BY c.id, c.name
  ORDER BY count DESC
`).all();
dist.forEach(d => console.log(`  ${d.name}: ${d.count} coupons`));

db.close();
