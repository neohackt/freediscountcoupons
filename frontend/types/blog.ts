export interface BlogAuthor {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  avatar?: { url: string; alternativeText?: string } | null;
  bio?: string;
}

export interface BlogCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  keyTakeaways?: string[] | null;
  featuredImage?: { url: string; alternativeText?: string; width?: number; height?: number } | null;
  category?: BlogCategory | null;
  author?: BlogAuthor | null;
  relatedStores?: RelatedStore[] | null;
  faqItems?: FAQItem[] | null;
  readingTime: number;
  featured: boolean;
  viewCount: number;
  seo_title?: string;
  seo_description?: string;
  og_image?: { url: string; alternativeText?: string } | null;
  noindex: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface RelatedStore {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  logo?: { url: string; alternativeText?: string } | null;
  affiliate_url?: string;
  activeCouponCount?: number;
}

export interface RelatedPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: { url: string; alternativeText?: string } | null;
  category?: BlogCategory | null;
  publishedAt: string;
  readingTime: number;
}

export interface BlogStrapiResponse<T> {
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

export interface BlogListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  featured?: boolean;
}

export interface SiteConfig {
  organizationName: string;
  organizationLogo: string;
  siteUrl: string;
}
