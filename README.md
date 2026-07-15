# Coupon & Deals Aggregator Website

A full-stack coupon and deals aggregator website built with **Next.js 14** (frontend) and **Strapi v5** (backend CMS).

## Features

- **Frontend (Next.js)**
  - Homepage with trending coupons and popular stores
  - Store pages with all available coupons
  - Category browsing
  - Search functionality for stores and coupons
  - Promo code reveal with auto-copy to clipboard
  - Verified badges for coupons
  - Responsive design with Tailwind CSS
  - SEO optimized

- **Backend (Strapi CMS)**
  - Manage stores/brands
  - Manage categories
  - Manage coupons and deals
  - Rich admin dashboard
  - RESTful API

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 19, TypeScript, Tailwind CSS |
| Backend | Strapi v5 |
| Database | SQLite (dev) / PostgreSQL (production) |
| Deployment | Vercel (frontend) + Railway/Render (Strapi) |

## Project Structure

```
E:\Coupon Website\
├── frontend/                    # Next.js Application
│   ├── app/
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout
│   │   ├── store/[slug]/       # Store pages
│   │   ├── browse/[slug]/      # Category pages
│   │   ├── stores/             # All stores
│   │   ├── browse/             # All categories
│   │   └── search/             # Search results
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── layout/             # Header, Footer, Container
│   │   └── features/           # Feature components
│   ├── lib/
│   │   ├── strapi.ts           # Strapi API client
│   │   ├── constants.ts        # Brand config
│   │   └── utils.ts            # Utility functions
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript types
│
└── backend/                    # Strapi CMS
    ├── src/api/
    │   ├── store/              # Stores collection
    │   ├── category/           # Categories collection
    │   └── coupon/             # Coupons collection
    └── config/                 # Strapi configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### 1. Setup Strapi Backend

```bash
cd backend

# Install dependencies (already done)
npm install

# Start Strapi in development mode
npm run develop
```

The Strapi admin will be available at `http://localhost:1337/admin`.

**First Time Setup:**
1. Create an admin account when prompted
2. Go to Settings > Roles > Public
3. Enable `find`, `findOne` permissions for:
   - Store
   - Category
   - Coupon

### 2. Setup Next.js Frontend

```bash
cd frontend

# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 3. Configure Environment Variables

Create `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-api-token
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Adding Content in Strapi

### Stores (Brands)

1. Go to Content Manager > Store
2. Click "Create new entry"
3. Fill in:
   - **Name**: Store name (e.g., "Amazon")
   - **Slug**: Auto-generated from name
   - **Logo**: Upload store logo
   - **Description**: Store description
   - **Website URL**: Official website
   - **Affiliate URL**: Your affiliate link
   - **Is Popular**: Check to show on homepage
   - **Categories**: Link to categories

### Categories

1. Go to Content Manager > Category
2. Click "Create new entry"
3. Fill in:
   - **Name**: Category name (e.g., "Electronics")
   - **Slug**: Auto-generated
   - **Icon**: Emoji or icon class
   - **Description**: Category description

### Coupons

1. Go to Content Manager > Coupon
2. Click "Create new entry"
3. Fill in:
   - **Title**: Discount title (e.g., "Up to 40% Off Sitewide")
   - **Description**: Details about the offer
   - **Code**: Promo code (e.g., "SAVE40")
   - **Discount Type**: percentage, fixed, free_shipping, bogo
   - **Discount Value**: The discount amount
   - **Affiliate URL**: Tracking link
   - **Verified**: Check if verified
   - **Expires At**: Expiration date
   - **Is Featured**: Check to show prominently
   - **Store**: Link to store
   - **Categories**: Link to categories

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Backend (Railway/Render/Supabase)

1. **Database**: Create a free PostgreSQL database on Supabase
2. **Deploy Strapi**: 
   - Railway: Connect GitHub repo, set environment variables
   - Render: Create new Web Service, connect repo

**Environment Variables for Production:**
```env
DATABASE_CLIENT=postgres
DATABASE_URL=your-supabase-connection-string
DATABASE_SSL=true
APP_KEYS=generate-new-keys
API_TOKEN_SALT=generate-new-salt
ADMIN_JWT_SECRET=generate-new-secret
JWT_SECRET=generate-new-secret
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stores` | GET | List all stores |
| `/api/stores/slug/:slug` | GET | Get store by slug |
| `/api/categories` | GET | List all categories |
| `/api/categories/slug/:slug` | GET | Get category by slug |
| `/api/coupons` | GET | List all coupons |
| `/api/coupons/featured` | GET | Get featured coupons |
| `/api/coupons/trending` | GET | Get trending coupons |

## Customization

### Brand Colors

Edit `frontend/lib/constants.ts` to customize:
- Brand name
- Primary/secondary colors
- SEO metadata

### Styling

The project uses Tailwind CSS. Modify colors in `frontend/app/globals.css` or extend the theme in `tailwind.config.ts`.

## License

MIT License - Feel free to use for personal or commercial projects.