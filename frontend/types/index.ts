export interface Store {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  logo?: {
    url: string;
    alternativeText?: string;
  } | null;
  description?: string;
  description_html?: string;
  faqs?: { question: string; answer: string }[];
  website_url?: string;
  affiliate_url?: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
  };
  is_popular: boolean;
  is_featured: boolean;
  categories?: Category[];
  coupons?: Coupon[];
  aliases?: string[];
  seo_title?: string;
  seo_description?: string;
  og_image?: { url: string; alternativeText?: string } | null;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parent?: Category | null;
  stores?: Store[];
  coupons?: Coupon[];
  seo_title?: string;
  seo_description?: string;
  og_image?: { url: string; alternativeText?: string } | null;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export type DiscountType = 'percentage' | 'fixed' | 'free_shipping' | 'bogo' | 'unknown';

export interface Coupon {
  id: number;
  documentId: string;
  title: string;
  description?: string;
  code: string;
  discount_type: DiscountType;
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
  seo_title?: string;
  seo_description?: string;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiRequestParams {
  populate?: string | string[];
  filters?: Record<string, unknown>;
  sort?: string | string[];
  pagination?: {
    page?: number;
    pageSize?: number;
  };
  fields?: string[];
}

export interface SearchFilters {
  query?: string;
  category?: string;
  store?: string;
  discountType?: DiscountType;
  verified?: boolean;
  featured?: boolean;
}

export interface SearchResultStore {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  logo?: { url: string } | null;
  score: number;
  matchType: string;
}

export interface SearchResultCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  icon?: string;
  score: number;
  matchType: string;
}

export interface SearchResultCoupon {
  id: number;
  documentId: string;
  title: string;
  code: string;
  discount_type: DiscountType;
  store?: { name: string; slug: string; logo?: { url: string } | null } | null;
  score: number;
  matchType: string;
}

export interface SearchResult {
  stores: SearchResultStore[];
  categories: SearchResultCategory[];
  coupons: SearchResultCoupon[];
}

export interface SearchResponse {
  data: SearchResult;
  meta: { total: number };
}

export interface AutocompleteStore {
  id: number;
  name: string;
  slug: string;
  logo?: { url: string } | null;
  type: 'store';
}

export interface AutocompleteCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  type: 'category';
}

export interface AutocompleteCoupon {
  id: number;
  title: string;
  code: string;
  store?: { name: string; slug: string } | null;
  type: 'coupon';
}

export interface AutocompleteResult {
  stores: AutocompleteStore[];
  categories: AutocompleteCategory[];
  coupons: AutocompleteCoupon[];
}

export type AutocompleteItem = AutocompleteStore | AutocompleteCategory | AutocompleteCoupon;