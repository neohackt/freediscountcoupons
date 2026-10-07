import type { MetadataRoute } from 'next';
import { SITE_URL, STRAPI_URL } from '@/lib/strapi';

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

interface StrapiEvent {
  slug: string;
  updatedAt: string;
}

async function getStores(): Promise<StrapiStore[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/stores?fields=0&populate=0&pagination[pageSize]=100`,
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
      `${STRAPI_URL}/api/categories?fields=0&populate=0&pagination[pageSize]=100`,
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
      `${STRAPI_URL}/api/blog-posts?fields=slug,updatedAt&pagination[pageSize]=100&filters[publishedAt][$notNull]=true`,
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

async function getEvents(): Promise<StrapiEvent[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/events/active`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    // /api/events/active selects only name/slug/sortOrder by design.
    return (data.data || []).map((e: { slug: string }) => ({
      slug: e.slug,
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stores, categories, blogPosts, events] = await Promise.all([getStores(), getCategories(), getBlogPosts(), getEvents()]);

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

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${SITE_URL}/events/${event.slug}`,
    lastModified: new Date(event.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...storePages, ...categoryPages, ...blogPages, ...eventPages];
}