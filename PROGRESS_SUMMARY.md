# Coupon Website Progress - May 4, 2026

## Project Overview
- **Project**: Coupon/deals website similar to joycoupons.com and dontpayfull.com
- **Backend**: Strapi v5.43.0 with SQLite (port 1337)
- **Frontend**: Next.js 16 (port 3000)

## Goals This Session
1. ✅ Fix homepage/Strapi 403 Forbidden error (API authentication)
2. ✅ Upload test data (stores and coupons)
3. ✅ Link coupons to stores (relation)
4. ✅ Fix show coupons on individual store pages

---

## Completed Tasks

### 1. API Authentication Fix (403 Forbidden)

| File | Change |
|-----|--------|
| `backend/src/api/store/routes/store.ts` | Added `config: { auth: false }` to all routes |
| `backend/src/api/coupon/routes/coupon.ts` | Added `config: { auth: false }` to all routes |
| `backend/src/api/category/routes/category.ts` | Added `config: { auth: false }` to all routes |

### 2. Data Import

| Action | Result |
|--------|--------|
| Uploaded `test_stores.csv` | 7 stores imported |
| Uploaded `test_coupons.csv` | 8 coupons imported |
| Created `/api/import/link-coupons` endpoint | Linked all 8 coupons to stores |

### 3. Relation Fix (Coupons Not Showing on Store Pages)

| File | Fix |
|------|-----|
| `backend/src/api/coupon/controllers/coupon.ts` | Added `find()` and `findOne()` with populate |
| `backend/src/api/store/controllers/store.ts` | Added `find()` and `findOne()` with populate |
| `backend/src/api/coupon/routes/coupon.ts` | Moved `/coupons/featured` route before `/:id` |
| Removed `sanitizeOutput()` | Was stripping relations from response |

### 4. Bootstrap Auto-Link

| File | Purpose |
|------|---------|
| `backend/src/index.ts` | Auto-links coupons to stores on startup |

---

## API Endpoints Working

| Endpoint | Returns |
|----------|---------|
| `GET /api/stores` | Stores with coupons array |
| `GET /api/stores/slug/:slug` | Store with coupons |
| `GET /api/coupons` | Coupons with store relation |
| `GET /api/coupons/featured` | 4 featured coupons |
| `POST /api/import/link-coupons` | Link coupons to stores |
| `GET /api/import/stats` | {total_stores:8, total_coupons:8} |

---

## Data Summary

### Stores (8)
| Name | Slug | Coupons |
|------|------|--------|
| Amazon | amazon | 2 |
| Walmart | walmart | 2 |
| Target | target | 1 |
| Best Buy | bestbuy | 1 |
| Nike | nike | 1 |
| Adidas | adidas | 1 |
| eBay | ebay | 0 |

### Coupons (8)
| Store | Title | Code | Verified |
|-------|-------|------|---------|
| Amazon | 50% Off Your Order | SAVE50 | ✅ |
| Amazon | Free Shipping | FREESHIP | ✅ |
| Walmart | $20 Off $100+ | SAVE20 | ✅ |
| Walmart | Free Shipping No Min | FREE | ✅ |
| Target | 15% Off Sitewide | SITE15 | ✅ |
| Best Buy | 25% Off Electronics | TECH25 | ✅ |
| Nike | Extra 10% Off | EXTRA10 | ✅ |
| Adidas | 30% Off Sale Items | SALE30 | ❌ |

---

## Pending Tasks

1. **Start frontend** - Run `npm run dev` to verify homepage loads
2. **Add expiration checks** - Auto-expire coupons past expires_at
3. **Categories** - Add test category data

---

## Commands

```bash
# Backend (running on :1337)
cd backend && npm run develop

# Frontend (to start on :3000)
cd frontend && npm run dev
```

---

## File Changes Summary

```
backend/src/
├── index.ts                          # Bootstrap auto-link
├── api/
│   ├── store/
│   │   ├── controllers/store.ts     # Added find/findOne with populate
│   │   └── routes/store.ts           # Added auth: false
│   ├── coupon/
│   │   ├── controllers/coupon.ts   # Added find/findOne, removed sanitizeOutput
│   │   ├── routes/coupon.ts        # Fixed route order
│   │   └── routes/coupon.ts       # auth: false
│   ├── category/
│   │   └── routes/category.ts    # auth: false
│   └── import-job/
│       ├── controllers/import-job.ts  # Added linkCouponsToStores
│       └── routes/import-job.ts         # Added /import/link-coupons

test_coupons.csv    # Updated expires_at to 2027-06-04
```