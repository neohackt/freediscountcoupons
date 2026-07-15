const Database = require('better-sqlite3');
const db = new Database('.tmp/data.db');

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

// Check coupon-category links
const linkTables = tables.filter(t => t.name.includes('categor'));
console.log('\nCategory-related tables:', linkTables.map(t => t.name));

// Check how many coupons have category links
for (const t of linkTables) {
  if (t.name.includes('_links') || t.name.includes('_order')) {
    const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
    console.log(`\n${t.name}: ${count.c} rows`);
    if (count.c > 0) {
      const sample = db.prepare(`SELECT * FROM "${t.name}" LIMIT 5`).all();
      console.log(JSON.stringify(sample, null, 2));
    }
  }
}

// Check a specific coupon with populate
const coupon = db.prepare('SELECT id, title FROM coupons LIMIT 3').all();
console.log('\nCoupons:', coupon);

// Check store-category links too
const storeLinkTables = tables.filter(t => t.name.includes('store') && (t.name.includes('links') || t.name.includes('order')));
console.log('\nStore link tables:', storeLinkTables.map(t => t.name));
for (const t of storeLinkTables) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
  console.log(`${t.name}: ${count.c} rows`);
}

db.close();
