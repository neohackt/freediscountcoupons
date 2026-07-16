import { API_CONFIG } from './constants';
import type { BlogPost, BlogCategory, BlogStrapiResponse, BlogListParams } from '@/types/blog';

const STRAPI_URL = API_CONFIG.strapiUrl;

async function fetchStrapi<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${STRAPI_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.set(key, value);
      });
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (API_CONFIG.apiToken) headers['Authorization'] = `Bearer ${API_CONFIG.apiToken}`;
    const res = await fetch(url.toString(), { headers, next: { revalidate: 300 } });
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
