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
  featuredImage?: { url: string; alternativeText?: string; width?: number; height?: number } | null;
  category?: BlogCategory | null;
  author?: BlogAuthor | null;
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
