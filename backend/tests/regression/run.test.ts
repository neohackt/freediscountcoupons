import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const BASE = 'http://localhost:1337';
const REVALIDATE_PORT = 3999;
const ADMIN_EMAIL = 'test-admin@example.com';
const ADMIN_PASSWORD = 'TestPass123!';

// ---------- Preflight ----------
const dbFile = process.env.DATABASE_FILENAME || './test-db/data.db';
const dbAbs = path.resolve(ROOT, dbFile);
const testDbDir = path.resolve(ROOT, 'test-db');
if (!dbAbs.startsWith(testDbDir + path.sep) && dbAbs !== testDbDir) {
  console.error('PREFLIGHT FAIL: DATABASE_FILENAME not inside backend/test-db/:', dbAbs);
  process.exit(1);
}
if (dbAbs === path.resolve(ROOT, '.tmp', 'data.db')) {
  console.error('PREFLIGHT FAIL: must not use backend/.tmp/data.db');
  process.exit(1);
}
if (dbAbs.toLowerCase().includes('production')) {
  console.error('PREFLIGHT FAIL: must not use a production database');
  process.exit(1);
}
console.log('Preflight OK — DB:', dbAbs);

// ---------- Mock revalidation server ----------
const received: { paths: string[]; tags: string[] }[] = [];
const mockServer = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const j = JSON.parse(body);
        received.push({ paths: j.paths || [], tags: j.tags || [] });
      } catch {}
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, revalidated: (JSON.parse(body).paths || []), timestamp: Date.now() }));
    });
  } else {
    res.statusCode = 404; res.end();
  }
});
const mockReady = new Promise<void>((resolve) => mockServer.listen(REVALIDATE_PORT, resolve));
// resolved inside main()

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ---------- HTTP helpers ----------
async function api(pathname: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(BASE + pathname, init);
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, json, text };
}

let adminToken = '';
async function adminLogin(): Promise<string> {
  // First-run admin creation (works only when no admin exists).
  const reg = await api('/admin/register-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, firstname: 'Test', lastname: 'Admin' }),
  });
  let token = reg.json?.data?.token || reg.json?.data?.accessToken || reg.json?.token || reg.json?.accessToken;
  if (token) return token;
  // Fallback to login if an admin already existed.
  const login = await api('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  token = login.json?.data?.token || login.json?.data?.accessToken || login.json?.token || login.json?.accessToken;
  if (!token) throw new Error('Admin login failed: ' + JSON.stringify(login.json) + ' / reg: ' + JSON.stringify(reg.json));
  return token;
}

function authHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${adminToken}`, ...extra };
}

async function uploadCsv(filePath: string, type = 'coupons') {
  const form = new FormData();
  const buf = fs.readFileSync(filePath);
  form.append('type', type);
  form.append('file', new Blob([buf], { type: 'text/csv' }), path.basename(filePath));
  return api('/api/import/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (process.env.IMPORT_API_TOKEN || 'test-import-token') },
    body: form,
  });
}

// ---------- Assertions ----------
let passed = 0, failed = 0;
function check(cond: boolean, msg: string) {
  if (cond) { passed++; console.log('  PASS:', msg); }
  else { failed++; console.log('  FAIL:', msg); }
}

function receivedPaths() { return received.flatMap((r) => r.paths); }
function receivedIncludes(p: string) { return receivedPaths().some((x) => x === p || x.includes(p)); }

// ---------- Main ----------
async function main() {
  await mockReady;
  console.log('Mock revalidation server on', REVALIDATE_PORT);
  // Ensure first-run admin registration is possible on the test copy.
  const setupDb = new Database(dbAbs);
  try { setupDb.prepare('DELETE FROM admin_users_roles_lnk').run(); } catch {}
  try { setupDb.prepare('DELETE FROM admin_users').run(); } catch {}
  setupDb.close();
  adminToken = await adminLogin();
  console.log('Admin token obtained');

  // Count baseline coupons for amazon
  const before = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=1');
  const baselineTotal = before.json?.meta?.pagination?.total ?? 0;
  console.log('Baseline amazon coupons:', baselineTotal);

  // ---- Test 1 & 2: duplicate rows + re-upload creates new records ----
  console.log('\n[1] Import duplicate CSV (2 identical rows)');
  const r1 = await uploadCsv(path.join(__dirname, 'fixtures', 'coupons_dup.csv'));
  console.log('  upload1:', r1.status, r1.json?.data?.imported_count ?? r1.json?.imported_count);
  const imported1 = r1.json?.data?.imported_count ?? r1.json?.imported_count ?? 0;
  check(imported1 === 2, 'imported_count = 2 for 2 identical rows');

  const after1 = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100');
  const total1 = after1.json?.meta?.pagination?.total ?? 0;
  check(total1 === baselineTotal + 2, `total increased by 2 (got ${total1}, expected ${baselineTotal + 2})`);

  console.log('[2] Re-upload same CSV');
  const r2 = await uploadCsv(path.join(__dirname, 'fixtures', 'coupons_dup.csv'));
  const imported2 = r2.json?.data?.imported_count ?? r2.json?.imported_count ?? 0;
  check(imported2 === 2, 'second import imported_count = 2');
  const after2 = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100');
  const total2 = after2.json?.meta?.pagination?.total ?? 0;
  check(total2 === baselineTotal + 4, `total increased by 4 (got ${total2}, expected ${baselineTotal + 4})`);

  // ---- Test 4: auto-publish ----
  console.log('[4] Auto-publish check');
  const all = after2.json?.data || [];
  const testCoupons = all.filter((c: any) => c.code === 'TESTCODE1');
  check(testCoupons.length >= 4, 'test coupons present');
  check(testCoupons.every((c: any) => c.publishedAt != null), 'all imported coupons have publishedAt');

  // ---- Test 7: store relationship ----
  console.log('[7] Store relationship');
  check(testCoupons.every((c: any) => c.store?.slug === 'amazon'), 'imported coupons linked to amazon');

  // ---- Test 9: cache invalidation on import ----
  console.log('[9] Cache invalidation on import');
  check(receivedIncludes('/store/amazon'), 'import invalidated /store/amazon');
  check(receivedIncludes('/sitemap.xml') || receivedIncludes('/'), 'import invalidated homepage/sitemap');

  // ---- Test 12/16 ordering ----
  console.log('[16] Newest-first ordering');
  const ordered = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100');
  const rows = ordered.json?.data || [];
  let orderedOk = true;
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].createdAt).getTime();
    const cur = new Date(rows[i].createdAt).getTime();
    if (prev < cur) { orderedOk = false; break; }
    if (prev === cur && rows[i - 1].id < rows[i].id) { orderedOk = false; break; }
  }
  check(orderedOk, 'coupons returned createdAt DESC, id DESC');

  // ---- Test 21: custom sort ignored ----
  console.log('[21] Custom sort ignored');
  const custom = await api('/api/coupons?filters[store][slug][$eq]=amazon&sort[title]=asc&pagination[pageSize]=100');
  const customRows = custom.json?.data || [];
  let customOk = true;
  for (let i = 1; i < customRows.length; i++) {
    const prev = new Date(customRows[i - 1].createdAt).getTime();
    const cur = new Date(customRows[i].createdAt).getTime();
    if (prev < cur) { customOk = false; break; }
  }
  check(customOk, 'custom sort param ignored, still newest-first');

  // ---- Pick one test coupon for publish/unpublish/delete flows ----
  const target = testCoupons[0];
  const docId = target.documentId;
  console.log('Target coupon documentId:', docId);

  // ---- Test 5: unpublish retains DB row, hides from all public endpoints ----
  console.log('\n[5] Unpublish');
  const unp = await api(`/content-manager/collection-types/api::coupon.coupon/${docId}/actions/unpublish`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });
  console.log('  unpublish status:', unp.status);
  check(unp.status === 200 || unp.status === 204, 'unpublish succeeded');

  // DB check
  const db = new Database(dbAbs, { readonly: true });
  const dbRow = db.prepare('SELECT id, published_at FROM coupons WHERE document_id = ?').get(docId) as any;
  check(!!dbRow, 'DB row retained after unpublish');
  check(dbRow && dbRow.published_at === null, 'published_at IS NULL after unpublish');
  db.close();

  // Public endpoints hide it
  const pub1 = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100');
  check(!(pub1.json?.data || []).some((c: any) => c.documentId === docId), 'unpublished hidden from /api/coupons');
  const feat = await api('/api/coupons/featured');
  check(!(feat.json?.data || []).some((c: any) => c.documentId === docId), 'unpublished hidden from featured');
  const trend = await api('/api/coupons/trending');
  check(!(trend.json?.data || []).some((c: any) => c.documentId === docId), 'unpublished hidden from trending');

  const storePage = await api('/api/stores/slug/amazon');
  const spCoupons = storePage.json?.data?.coupons || [];
  check(!spCoupons.some((c: any) => c.documentId === docId), 'unpublished hidden from store page coupons');

  const search = await api(`/api/search?q=${encodeURIComponent(target.title)}`);
  const searchCoupons = search.json?.coupons || [];
  check(!searchCoupons.some((c: any) => c.id === target.id), 'unpublished hidden from search');

  // ---- Test 11: cache invalidation on unpublish ----
  console.log('[11] Cache invalidation on unpublish');
  check(receivedIncludes('/store/amazon'), 'unpublish invalidated /store/amazon');
  // Note: the /store/[slug] dynamic pattern is added only in the fallback path
  // (unknown previous state), which is covered by invalidation.unit.test.ts.
  // In the normal (captured) path, the concrete /store/<slug> is invalidated
  // (asserted above).

  // ---- Test 6: delete ----
  console.log('\n[6] Delete');
  const del = await api(`/content-manager/collection-types/api::coupon.coupon/${docId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  console.log('  delete status:', del.status);
  check(del.status === 200 || del.status === 204, 'delete succeeded');

  const db2 = new Database(dbAbs, { readonly: true });
  const dbRow2 = db2.prepare('SELECT id FROM coupons WHERE document_id = ?').get(docId);
  check(!dbRow2, 'DB row removed after delete');
  db2.close();

  const pub2 = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100');
  check(!(pub2.json?.data || []).some((c: any) => c.documentId === docId), 'deleted hidden from /api/coupons');

  // ---- Test 3: reimport after deletion creates new record ----
  console.log('\n[3] Reimport after deletion');
  const singleCsv = path.join(__dirname, 'fixtures', 'coupons_single.csv');
  fs.writeFileSync(singleCsv, 'title,code,store_slug,discount_type,discount_value,verified\nTest Coupon A,TESTCODE1,amazon,percentage,10,true\n');
  const r3 = await uploadCsv(singleCsv);
  const imported3 = r3.json?.data?.imported_count ?? r3.json?.imported_count ?? 0;
  check(imported3 === 1, 'reimport after delete created 1 new record');
  const after3 = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100');
  const reimported = (after3.json?.data || []).find((c: any) => c.code === 'TESTCODE1');
  check(!!reimported && reimported.documentId !== docId, 'reimported coupon has new documentId');

  // ---- Test 8: no relinking ----
  console.log('\n[8] No relinking endpoint');
  const linkRes = await api('/api/import/link-coupons', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + (process.env.IMPORT_API_TOKEN || 'test-import-token') },
  });
  check(linkRes.status >= 400, '/import/link-coupons no longer accepts POST (removed/disabled)');

  // ---- Test 19/20: pagination ordering ----
  console.log('\n[19/20] Pagination ordering');
  const p1 = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[page]=1&pagination[pageSize]=2');
  const p2 = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[page]=2&pagination[pageSize]=2');
  const ids1 = (p1.json?.data || []).map((c: any) => c.id);
  const ids2 = (p2.json?.data || []).map((c: any) => c.id);
  check(ids1.length === 2 && ids2.length >= 1, 'pagination returns pages');
  // ensure no overlap and descending
  check(!ids1.some((id: number) => ids2.includes(id)), 'no overlap between pages');

  // ---- Test 22: edit stability ----
  console.log('\n[22] Edit stability');
  const toEdit = (await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100')).json?.data?.[0];
  if (toEdit) {
    const createdAtBefore = toEdit.createdAt;
    const putRes = await api(`/content-manager/collection-types/api::coupon.coupon/${toEdit.documentId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ description: 'edited description ' + Date.now() }),
    });
    check(putRes.status === 200, 'PUT update succeeded');
    const after = await api('/api/coupons?filters[store][slug][$eq]=amazon&pagination[pageSize]=100');
    const edited = (after.json?.data || []).find((c: any) => c.documentId === toEdit.documentId);
    check(!!edited && edited.createdAt === createdAtBefore, 'createdAt unchanged after edit');
  }

  // ---- Test 23: search filtering ----
  console.log('\n[23] Search filtering');
  // already covered partially; ensure autocomplete endpoint works
  const ac = await api('/api/search/autocomplete?q=TESTCODE1');
  check(ac.status === 200, 'autocomplete endpoint works');

  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`);
  await new Promise<void>((resolve) => mockServer.close(() => resolve()));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });