# Coupon Website - Agent Instructions

## Architecture

Two separate apps in a monorepo:

- **`frontend/`** — Next.js 16, React 19, Tailwind CSS 4, TypeScript
- **`backend/`** — Strapi v5.50.1 CMS, SQLite dev database

## Quick Start

```bash
# Backend (Strapi) — terminal 1
cd backend && npm run dev    # runs on :1337

# Frontend (Next.js) — terminal 2
cd frontend && npm run dev   # runs on :3000
```

**First-time setup**: After creating Strapi admin account, go to Settings > Roles > Public and enable `find`, `findOne` for Store, Category, Coupon.

## Commands

| Task | Command |
|------|---------|
| Dev frontend | `cd frontend && npm run dev` |
| Dev backend | `cd backend && npm run dev` |
| Build frontend | `cd frontend && npm run build` |
| Build backend | `cd backend && npm run build` |
| Lint frontend | `cd frontend && npm run lint` |

**Backend rebuild is required** after modifying any `src/` TypeScript files in the backend.

## Strapi API Patterns

The frontend uses `StrapiClient` class (`frontend/lib/strapi.ts`) which auto-populates relations:

- Stores: populates `logo`, `categories`
- Coupons: populates `store`, `store.logo`, `categories`

All API calls include `Content-Type: application/json`. If `STRAPI_API_TOKEN` is set, it sends `Authorization: Bearer <token>`.

## Content Types

| Type | Location | Key Fields |
|------|----------|------------|
| Store | `backend/src/api/store/` | name, slug (uid), logo (media), is_popular, is_featured, description, description_html, faqs (json), categories (relation), seo_title, seo_description, og_image, noindex |
| Coupon | `backend/src/api/coupon/` | title, code, discount_type, discount_value, store (relation), is_expired, expires_at, verified, is_featured, success_rate, times_used, categories (relation) |
| Category | `backend/src/api/category/` | name, slug (uid), icon |
| ImportJob | `backend/src/api/import-job/` | filename, format, type, status, total_rows, imported_count, errors |

## Environment Files

- `backend/.env` — Contains `APP_KEYS`, `JWT_SECRET`, `DATABASE_FILENAME=.tmp/data.db`, `REVALIDATE_URL`, `REVALIDATE_SECRET`
- `frontend/.env.local` — `NEXT_PUBLIC_STRAPI_URL=http://localhost:1337`, `NEXT_PUBLIC_SITE_URL`

## Gotchas

- **CRITICAL: SQLite DB is at `backend/.tmp/data.db` — NEVER delete `.tmp/` directory. It contains the production dev database. Always back up before any cleanup.**
- **Backup command**: `Copy-Item backend\.tmp\data.db -Destination backend\backups\data_$(Get-Date -Format yyyy-MM-dd_HHmmss).db`
- Strapi media uploads stored at `backend/public/uploads/`
- `responsiveImageFormat: []` in plugins.ts disables Sharp optimization (Windows EBUSY fix)
- The `STRAPI_API_TOKEN` in frontend `.env.local` is empty — unauthenticated requests work if Public role permissions are enabled
- Route order matters in Strapi: specific paths (e.g., `/coupons/featured`) must come before parameterized paths (e.g., `/coupons/:id`)
- `marked` v18 is installed in backend for markdown→HTML conversion (description → description_html)
- `@tailwindcss/typography` is a devDependency in frontend for prose styling
- CouponButton uses **inline styles** (not CSS classes) — bypasses Tailwind CSS v4 layer issues
- Tailwind CSS v4: custom CSS must NOT be wrapped in `@layer components` — Tailwind strips it

## Strapi v5 CodeMirror Bug (Fixed)

The `faqs` JSON field in Store content type triggers a known Strapi 5.50.1 bug where multiple `@codemirror/state` instances are loaded, breaking the admin panel editor.

**Fix applied** (will be fixed upstream in Strapi 5.50.3):
- `backend/package.json` — `overrides` section pins `@codemirror/state@6.6.0` and `@codemirror/view@6.43.0`
- `backend/src/admin/vite.config.js` — forces Vite dedupe and alias for all CodeMirror packages

## Data Backup & Recovery

- **Database location**: `backend/.tmp/data.db` (SQLite)
- **Backups directory**: `backend/backups/`
- **Restore**: Copy `.db` file back to `.tmp/data.db` and restart Strapi
- **CSV import data**: `sample_categories.csv`, `sample_stores_fixed.csv`, `sample_coupons_fixed.csv`
- **Import API**: POST `/import/upload` with multipart form (fields: `type` = categories/stores/coupons, `file` = CSV)
- **Link coupons**: POST `/import/link-coupons` (links coupons to stores via store_slug)

## Expired Coupons Feature

- Store pages show expired coupons under "Expired Coupons" section below active coupons
- `HolyCouponCard` accepts `isExpired` prop — shows grey "Expired" badge, muted styling
- "Get Deal" button stays active for expired coupons (opens affiliate link)
- Stats card (BrandStats) only counts active coupons (excludes expired)
- **Daily cron job** at 3:00 AM UTC deletes coupons where `is_expired=true` AND `expires_at` is >30 days old (`backend/src/index.ts`)

## Similar Stores Feature

- Store pages show "Similar Stores" section in sidebar below BrandStats
- Backend endpoint: `GET /stores/similar/:slug` — finds stores sharing same categories, returns up to 10
- "VIEW ALL" links to the store's first category page

## Search Feature

- **Backend**: `GET /api/search?q=keyword` — full search with scoring; `GET /api/search/autocomplete?q=keyword` — autocomplete
- **Scoring**: Exact Store Match = 100, Alias Match = 95, Store Contains = 80, Category = 60, Coupon Title = 40, Description = 20
- **Autocomplete**: Debounce 300ms, min 2 chars, max 8 suggestions, keyboard nav (↑↓ Enter Escape)
- **Store aliases**: `aliases` field (JSON array) on Store — e.g., `["nike", "nike.com"]` for Nike
- **Search page**: `/search?q=nike` — SSR, `<meta robots="noindex,follow">`
- **SearchBar component**: `frontend/components/features/SearchBar.tsx` — default export, autocomplete dropdown
- **useSearch hook**: `frontend/hooks/useSearch.ts` — `useAutocomplete()` for dropdown, `useSearch()` for full page
- **SearchResults component**: `frontend/components/features/SearchResults.tsx` — grouped stores/coupons/categories
- **Backend search service**: `backend/src/api/search/services/search.ts` — uses `strapi.db.query()` directly

## Graphify Plugin

This project has a graphify knowledge graph at `graphify-out/`. After modifying code, run `graphify update .` to keep it current.
