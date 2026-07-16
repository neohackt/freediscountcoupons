import type { MetadataRoute } from 'next';
import { API_CONFIG, SITE_URL } from '@/lib/constants';

interface StrapiStore {
  slug: string;
  updatedAt: string;
}

interface StrapiCategory {
  slug: string;
  updatedAt: string;
}

interface StrapiBlogPost {
  slug: string;
  updatedAt: string;
}

async function getStores(): Promise<StrapiStore[]> {
  try {
    const response = await fetch(
      `${API_CONFIG.strapiUrl}/api/stores?fields=0&populate=0&pagination[pageSize]=100`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    return (data.data || []).map((s: { slug: string; updatedAt: string }) => ({
      slug: s.slug,
      updatedAt: s.updatedAt,
    }));
  } catch {
    return [];
  }
}

async function getCategories(): Promise<StrapiCategory[]> {
  try {
    const response = await fetch(
      `${API_CONFIG.strapiUrl}/api/categories?fields=0&populate=0&pagination[pageSize]=100`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    return (data.data || []).map((c: { slug: string; updatedAt: string }) => ({
      slug: c.slug,
      updatedAt: c.updatedAt,
    }));
  } catch {
    return [];
  }
}

async function getBlogPosts(): Promise<StrapiBlogPost[]> {
  try {
    const response = await fetch(
      `${API_CONFIG.strapiUrl}/api/blog-posts?fields=slug,updatedAt&pagination[pageSize]=100&filters[publishedAt][$notNull]=true`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    return (data.data || []).map((p: { slug: string; updatedAt: string }) => ({
      slug: p.slug,
      updatedAt: p.updatedAt,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stores, categories, blogPosts] = await Promise.all([getStores(), getCategories(), getBlogPosts()]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/stores`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const storePages: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${SITE_URL}/store/${store.slug}`,
    lastModified: new Date(store.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/browse/${category.slug}`,
    lastModified: new Date(category.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...storePages, ...categoryPages, ...blogPages];
}
