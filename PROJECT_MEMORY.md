# Coupon Website - Complete Project Memory
Last Updated: May 4, 2026

---

## Project Overview

**Purpose**: Coupon/deals website similar to joycoupons.com and dontpayfull.com
**Model**: Affiliate marketing (users click through to retailers using affiliate links)

### Tech Stack
- **Backend**: Strapi v5.43.0 with SQLite database (port 1337)
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4

---

## Backend Structure

### Config Files
- `backend/config/server.ts` - Server on 0.0.0.0:1337
- `backend/config/database.ts` - SQLite at .tmp/data.db
- `backend/config/admin.ts` - Admin panel config
- `backend/config/api.ts` - REST defaults (25 limit, max 100, withCount)
- `backend/config/plugins.ts` - Upload provider: @strapi/provider-upload-local
- `backend/config/middlewares.ts` - Logger, errors, security, cors, etc.

### Content Types (Schemas)

**Store** (`backend/src/api/store/`)
- Attributes: name, slug (uid), logo (media), description (text), website_url, affiliate_url, is_popular, is_featured
- Relations: categories (manyToMany), coupons (oneToMany via mappedBy)

**Coupon** (`backend/src/api/coupon/`)
- Attributes: title, description, code, discount_type, discount_value, discount_text, affiliate_url, verified, verified_at, expires_at, is_featured, is_expired, success_rate, times_used
- Relations: store (manyToOne), categories (manyToMany)

**Category** (`backend/src/api/category/`)
- Attributes: name, slug (uid), icon, description
- Relations: stores (manyToMany), coupons (manyToMany)

**ImportJob** (`backend/src/api/import-job/`)
- Bulk import tracking and job management

### Custom API Endpoints
- `GET /api/stores` - List stores
- `GET /api/stores/:id` - Single store
- `GET /api/stores/slug/:slug` - Store by slug
- `GET /api/coupons` - List coupons
- `GET /api/coupons/featured` - Featured coupons
- `GET /api/coupons/trending` - Trending coupons
- `GET /api/categories` - List categories
- `POST /api/import/upload` - Upload CSV for bulk import
- `POST /api/import/link-coupons` - Link coupons to stores (if missed)
- `GET /api/import/stats` - Import statistics

---

## Frontend Structure

### Environment
```
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Key Directories
- `frontend/app/` - Next.js App Router pages
- `frontend/components/features/` - Feature components
- `frontend/components/ui/` - UI components
- `frontend/lib/` - Utilities and API client

### TypeScript Interfaces

```typescript
interface Store {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  logo?: Media | null;
  description?: string;
  website_url?: string;
  affiliate_url?: string;
  is_popular: boolean;
  is_featured: boolean;
  categories?: Category[];
  coupons?: Coupon[];
}

interface Coupon {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  code: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping' | 'bogo' | 'unknown';
  discount_value?: number;
  discount_text?: string;
  affiliate_url?: string;
  verified: boolean;
  verified_at?: string;
  expires_at?: string;
  is_featured: boolean;
  is_expired: boolean;
  success_rate: number;
  times_used: number;
  store?: Store;
  categories?: Category[];
}

interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}
```

---

## Components

### Feature Components
- `RatingWidget.tsx` - Star rating with localStorage
- `BrandStats.tsx` - Stats (Total Offers, Verified, Used Today, Best Discount)
- `StoreSidebar.tsx` - Sidebar with logo, CTA button, rating
- `HolyCouponCard.tsx` - Coupon card for store page
- `HomepageCouponCard.tsx` - Coupon card for homepage
- `StoreCard.tsx` - Store card with logo

### Pages
- `frontend/app/page.tsx` - Homepage
- `frontend/app/store/[slug]/page.tsx` - Individual store page
- `frontend/app/search/page.tsx` - Search functionality
- `frontend/app/category/[category]/page.tsx` - Category pages

---

## Styling

### Color Palette (dontpayfull.com inspired)
```css
--primary: #FF9800;
--primary-hover: #F57C00;
--text: #333333;
--text-secondary: #666666;
--background: #FFFFFF;
--light-bg: #F5F5F5;
--border: #E0E0E0;
--success: #4CAF50;
--error: #F44336;
```

---

## Data

### Stores (8)
| Name | Slug | Coupons | is_popular |
|------|------|--------|-----------|
| Amazon | amazon | 2 | ✅ |
| Walmart | walmart | 2 | ✅ |
| Target | target | 1 | ✅ |
| Best Buy | bestbuy | 1 | ✅ |
| Nike | nike | 1 | ✅ |
| Adidas | adidas | 1 | ❌ |
| eBay | ebay | 0 | ❌ |
| Temu | store | 0 | ✅ |

### Coupons (8)
| Store | Title | Code | Verified | Expires |
|-------|-------|------|---------|---------|
| Amazon | 50% Off Your Order | SAVE50 | ✅ | 2027-06-04 |
| Amazon | Free Shipping | FREESHIP | ✅ | 2027-06-04 |
| Walmart | $20 Off $100+ | SAVE20 | ✅ | 2027-06-04 |
| Walmart | Free Shipping No Min | FREE | ✅ | 2027-06-04 |
| Target | 15% Off Sitewide | SITE15 | ✅ | 2027-06-04 |
| Best Buy | 25% Off Electronics | TECH25 | ✅ | 2027-06-04 |
| Nike | Extra 10% Off | EXTRA10 | ✅ | 2027-06-04 |
| Adidas | 30% Off Sale Items | SALE30 | ❌ | 2027-06-04 |

---

## Fixes Applied (May 4, 2026)

### 1. API 403 Forbidden Fix
- Added `config: { auth: false }` to all route definitions
- Files: `store.ts`, `coupon.ts`, `category.ts` routes

### 2. Relation Fix (Coupons Not Showing)
- Added custom `find()` and `findOne()` controllers with populate
- Removed `sanitizeOutput()` which was stripping relations
- Fixed route ordering (`/coupons/featured` before `/:id`)
- Created `/api/import/link-coupons` for bulk linking

### 3. Test Data
- Created `test_stores.csv` and `test_coupons.csv`
- Extended expiration dates to 2027-06-04

---

## Commands

```bash
# Backend (port 1337)
cd backend && npm run develop

# Frontend (port 3000)
cd frontend && npm run dev
```

---

## Design References

- Similar sites: joycoupons.com, dontpayfull.com
- Primary color: #FF9800 (orange)
- Two-column store pages with sidebar
- Compact square store cards
- Brand logos in coupon cards

---

## File Structure

```
E:\Coupon Website\
├── PROGRESS_SUMMARY.md
├── PROJECT_MEMORY.md
├── test_stores.csv
├── test_coupons.csv
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── store/[slug]/page.tsx
│   │   └── api/ratings/route.ts
│   ├── components/features/
│   │   ├── RatingWidget.tsx
│   │   ├── BrandStats.tsx
│   │   ├── StoreSidebar.tsx
│   │   ├── HolyCouponCard.tsx
│   │   ├── HomepageCouponCard.tsx
│   │   └── StoreCard.tsx
│   ├── lib/api.ts
│   ├── types/index.ts
│   └── .env.local
│
└── backend/
    ├── config/
    │   ├── plugins.ts
    │   ├── database.ts
    │   └── server.ts
    ├── src/
    │   ├── index.ts
    │   └── api/
    │       ├── store/
    │       ├── coupon/
    │       ├── category/
    │       └── import-job/
    ├── .tmp/data.db
    └── .env
```