import sqlite3 from 'better-sqlite3';

const db = sqlite3('.tmp/data.db');

// Read the markdown from a file or hardcode it
const markdown = \$(Get-Content -Raw "E:\Coupon Website\backend\adidas-content.md" 2> || echo "placeholder")\;

// Update
const stmt = db.prepare('UPDATE stores SET description = ?, updated_at = ? WHERE id = 105');
stmt.run(markdown, new Date().toISOString());
console.log('Updated successfully');
db.close();
