export const BRAND_CONFIG = {
  name: 'CouponDeals',
  tagline: 'Save More, Pay Less',
  description: 'Find the best coupons, promo codes, and deals from thousands of stores',

  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
    },
    verified: '#16a34a',
    expired: '#dc2626',
    success: '#22c55e',
    warning: '#eab308',
  },

  seo: {
    title: 'CouponDeals - Best Coupons & Promo Codes',
    titleTemplate: '%s | CouponDeals',
    description: 'Save money with the latest coupons, promo codes, and deals from thousands of stores. Find verified discount codes and start saving today!',
    keywords: ['coupons', 'promo codes', 'deals', 'discounts', 'savings', 'voucher codes'],
  },

  social: {
    facebook: '',
    twitter: '',
    instagram: '',
  },

  features: {
    newsletter: true,
    popularStores: true,
    trendingCoupons: true,
    categories: true,
  },
} as const;

export const API_CONFIG = {
  strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
  apiToken: process.env.STRAPI_API_TOKEN || '',
} as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const ITEMS_PER_PAGE = 24;
export const STORES_PER_PAGE = 30;
export const FEATURED_COUPONS_COUNT = 12;
export const TRENDING_COUPONS_COUNT = 24;
export const POPULAR_STORES_COUNT = 20;