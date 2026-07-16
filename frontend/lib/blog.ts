import { API_CONFIG } from './constants';
import type { BlogPost, BlogCategory, BlogStrapiResponse, BlogListParams, RelatedPost } from '@/types/blog';

const STRAPI_URL = API_CONFIG.strapiUrl;

async function fetchStrapi<T>(path: string, params?: Record<string, string>, revalidate = 300): Promise<T | null> {
  try {
    const url = new URL(`${STRAPI_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_CONFIG.apiToken) headers['Authorization'] = `Bearer ${API_CONFIG.apiToken}`;
    const res = await fetch(url.toString(), { headers, next: { revalidate } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getBlogPosts({
  page = 1,
  pageSize = 9,
  category,
  search,
}: BlogListParams = {}): Promise<BlogStrapiResponse<BlogPost[]>> {
  const filters: string[] = [];
  if (category) filters.push(`filters[category][slug][$eq]=${category}`);
  if (search) {
    filters.push(`filters[$or][0][title][$containsi]=${search}`);
    filters.push(`filters[$or][1][excerpt][$containsi]=${search}`);
  }

  const params: Record<string, string> = {
    'populate[0]': 'featuredImage',
    'populate[1]': 'category',
    'populate[2]': 'author',
    'populate[3]': 'author.avatar',
    'sort': 'publishedAt:desc',
    'pagination[page]': String(page),
    'pagination[pageSize]': String(pageSize),
    'filters[publishedAt][$notNull]': 'true',
  };

  filters.forEach((f) => {
    const [key, ...rest] = f.split('=');
    if (key && rest.length) params[key] = rest.join('=');
  });

  const data = await fetchStrapi<BlogStrapiResponse<BlogPost[]>>('/api/blog-posts', params);
  return data || { data: [], meta: { pagination: { page, pageSize, pageCount: 0, total: 0 } } };
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const params: Record<string, string> = {
    'filters[featured][$eq]': 'true',
    'populate[0]': 'featuredImage',
    'populate[1]': 'category',
    'populate[2]': 'author',
    'populate[3]': 'author.avatar',
    'sort': 'publishedAt:desc',
    'pagination[pageSize]': '1',
    'filters[publishedAt][$notNull]': 'true',
  };
  const data = await fetchStrapi<BlogStrapiResponse<BlogPost[]>>('/api/blog-posts', params);
  return data?.data?.[0] || null;
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const params: Record<string, string> = {
    'populate[blog_posts]': 'true',
    'sort': 'name:asc',
  };
  const data = await fetchStrapi<BlogStrapiResponse<BlogCategory[]>>('/api/blog-categories', params);
  if (!data?.data) return [];
  return data.data.map((cat) => ({
    ...cat,
    postCount: Array.isArray((cat as any).blog_posts) ? (cat as any).blog_posts.length : 0,
  }));
}

export async function getTrendingPosts(limit = 5): Promise<BlogPost[]> {
  const params: Record<string, string> = {
    'populate[0]': 'featuredImage',
    'populate[1]': 'category',
    'populate[2]': 'author',
    'populate[3]': 'author.avatar',
    'sort': 'viewCount:desc',
    'pagination[pageSize]': String(limit),
    'filters[publishedAt][$notNull]': 'true',
  };
  const data = await fetchStrapi<BlogStrapiResponse<BlogPost[]>>('/api/blog-posts', params);
  return data?.data || [];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const params: Record<string, string> = {
    'filters[slug][$eq]': slug,
    'populate[0]': 'featuredImage',
    'populate[1]': 'category',
    'populate[2]': 'author',
    'populate[3]': 'author.avatar',
    'populate[4]': 'og_image',
    'populate[5]': 'relatedStores',
    'populate[6]': 'relatedStores.logo',
    'filters[publishedAt][$notNull]': 'true',
  };
  const data = await fetchStrapi<BlogStrapiResponse<BlogPost[]>>('/api/blog-posts', params, 3600);
  return data?.data?.[0] || null;
}

export async function getRelatedPosts(postId: number, categoryId?: number | null, limit = 6): Promise<RelatedPost[]> {
  const params: Record<string, string> = {
    'filters[id][$ne]': String(postId),
    'filters[publishedAt][$notNull]': 'true',
    'populate[0]': 'featuredImage',
    'populate[1]': 'category',
    'sort': 'publishedAt:desc',
    'pagination[pageSize]': String(limit * 2),
  };
  if (categoryId) {
    params['filters[category][id][$eq]'] = String(categoryId);
  }
  const data = await fetchStrapi<BlogStrapiResponse<BlogPost[]>>('/api/blog-posts', params, 3600);
  const posts = data?.data || [];
  return posts.slice(0, limit).map((p) => ({
    id: p.id,
    documentId: p.documentId,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featuredImage: p.featuredImage,
    category: p.category,
    publishedAt: p.publishedAt,
    readingTime: p.readingTime,
  }));
}
