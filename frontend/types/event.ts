export interface EventStore {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  logo?: {
    url: string;
    alternativeText?: string;
  } | null;
  website_url?: string;
  affiliate_url?: string;
}

export interface Event {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  shortDescription?: string | null;
  content?: string | null;
  heroImage?: {
    url: string;
    alternativeText?: string;
  } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: {
    url: string;
    alternativeText?: string;
  } | null;
  stores?: EventStore[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface EventNavItem {
  name: string;
  slug: string;
  sortOrder: number;
}
