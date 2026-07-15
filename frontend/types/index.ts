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