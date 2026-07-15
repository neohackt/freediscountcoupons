/**
 * Store controller
 */

import { factories } from '@strapi/strapi';
import { marked } from 'marked';

function ensureDescriptionHtml(entity: any) {
  if (!entity) return entity;
  if (entity.description && typeof entity.description === 'string') {
    if (!entity.description_html || entity.description_html.length === 0) {
      entity.description_html = marked.parse(entity.description) as string;
    }
  }
  return entity;
}

async function revalidateStore(slug: string) {
  const REVALIDATE_URL = process.env.REVALIDATE_URL || 'http://localhost:3000';
  const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'your-secret-key';
  try {
    await fetch(`${REVALIDATE_URL}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': REVALIDATE_SECRET,
      },
      body: JSON.stringify({ paths: [`/store/${slug}`] }),
    });
  } catch (err) {
    console.error('[Store Controller] Revalidation failed:', err);
  }
}

export default factories.createCoreController('api::store.store', ({ strapi }) => ({
  async find(ctx) {
    const entities = await strapi.db.query('api::store.store').findMany({
      where: { publishedAt: { $notNull: true } },
      populate: ['logo', 'categories', 'coupons'],
      orderBy: { is_popular: 'desc' },
    });

    return this.transformResponse(entities);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.db.query('api::store.store').findOne({
      where: { id: id as string, publishedAt: { $notNull: true } },
      populate: ['logo', 'categories', 'coupons'],
    });

    if (!entity) {
      return ctx.notFound('Store not found');
    }

    return this.transformResponse(entity);
  },

  async findSimilar(ctx) {
    const { slug } = ctx.params;

    const currentStore = await strapi.db.query('api::store.store').findOne({
      where: { slug, publishedAt: { $notNull: true } },
      populate: ['categories'],
    });

    if (!currentStore) {
      return ctx.notFound('Store not found');
    }

    const categoryIds = (currentStore.categories || []).map((c: any) => c.id);

    if (categoryIds.length === 0) {
      return this.transformResponse([]);
    }

    const similar = await strapi.db.query('api::store.store').findMany({
      where: {
        id: { $ne: currentStore.id },
        publishedAt: { $notNull: true },
        categories: { id: { $in: categoryIds } },
      },
      orderBy: { name: 'asc' },
      limit: 10,
    });

    // Deduplicate
    const seen = new Set<string>();
    const unique = similar.filter((s: any) => {
      if (seen.has(s.slug)) return false;
      seen.add(s.slug);
      return true;
    });

    return this.transformResponse(unique);
  },

  async findBySlug(ctx) {
    const { slug } = ctx.params;

    let entity = await strapi.db.query('api::store.store').findOne({
      where: { slug, publishedAt: { $notNull: true } },
      populate: ['logo', 'categories', 'coupons'],
    });

    if (!entity) {
      return ctx.notFound('Store not found');
    }

    // Safety net: regenerate description_html if missing, empty, or contains raw markdown
    const looksLikeMarkdown = entity.description_html && /^#+\s/m.test(entity.description_html);
    if (entity.description && (!entity.description_html || entity.description_html.length === 0 || looksLikeMarkdown)) {
      const html = marked.parse(entity.description) as string;
      await strapi.db.query('api::store.store').update({
        where: { id: entity.id },
        data: { description_html: html },
      });
      entity.description_html = html;
    }
    // If description_html has raw markdown but description is just a one-liner,
    // use the markdown content from description_html as the source
    else if (looksLikeMarkdown && entity.description && !/^#+\s/m.test(entity.description)) {
      const html = marked.parse(entity.description_html) as string;
      await strapi.db.query('api::store.store').update({
        where: { id: entity.id },
        data: { description: entity.description_html, description_html: html },
      });
      entity.description_html = html;
    }

    return this.transformResponse(entity);
  },
}));
