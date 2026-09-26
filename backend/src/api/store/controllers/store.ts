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

export interface CountryMarket {
  code: string;
  name: string;
  flag: string;
  couponCount: number;
}

/**
 * Build the per-store country-market list from active coupons.
 * - A market exists only for coupons with at least one Country relation
 *   (global coupons with empty/null countries never create a market).
 * - Each country appears once, sorted by name; couponCount counts active
 *   targeted coupons for that country (a multi-country coupon counts once
 *   for each applicable country).
 * - hasMultipleCountries is true when 2+ markets exist.
 * - The Store.country string field is never consulted.
 */
export function buildCountryMarkets(
  coupons: Array<{
    countries?: Array<{ code: string; name: string; flag: string }> | null;
  }> | null | undefined
): { countries: CountryMarket[]; hasMultipleCountries: boolean } {
  const byCode = new Map<string, CountryMarket>();

  for (const coupon of coupons ?? []) {
    for (const country of coupon.countries ?? []) {
      if (!country?.code) continue;
      const existing = byCode.get(country.code);
      if (existing) {
        existing.couponCount++;
      } else {
        byCode.set(country.code, {
          code: country.code,
          name: country.name,
          flag: country.flag,
          couponCount: 1,
        });
      }
    }
  }

  const countries = [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { countries, hasMultipleCountries: countries.length >= 2 };
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

  async countryMarkets(ctx) {
    const { slug } = ctx.params;

    const store = await strapi.db.query('api::store.store').findOne({
      where: { slug, publishedAt: { $notNull: true } },
      select: ['id'],
    });

    if (!store) {
      return ctx.notFound('Store not found');
    }

    // Active coupons mirror the Store-page display rules: published and not expired.
    const coupons = await strapi.db.query('api::coupon.coupon').findMany({
      where: {
        store: store.id,
        is_expired: false,
        publishedAt: { $notNull: true },
      },
      select: ['id'],
      populate: { countries: { fields: ['code', 'name', 'flag'] } },
    });

    return this.transformResponse(buildCountryMarkets(coupons));
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
