/**
 * Coupon controller
 */

import { factories } from '@strapi/strapi';

function buildWhere(filters: any): any {
  if (!filters || typeof filters !== 'object') return {};
  const where: any = { publishedAt: { $notNull: true } };

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'categories' && typeof value === 'object' && value !== null) {
      const cat = value as any;
      if (cat.slug !== undefined) {
        const slugVal = cat.slug;
        if (Array.isArray(slugVal)) {
          where.categories = { slug: { $in: slugVal } };
        } else if (typeof slugVal === 'string') {
          where.categories = { slug: { $eq: slugVal } };
        } else if (typeof slugVal === 'object' && slugVal !== null) {
          where.categories = { slug: slugVal };
        }
      }
    } else if (key === 'store' && typeof value === 'object' && value !== null) {
      const store = value as any;
      if (store.slug !== undefined) {
        const slugVal = store.slug;
        if (Array.isArray(slugVal)) {
          where.store = { slug: { $in: slugVal } };
        } else if (typeof slugVal === 'string') {
          where.store = { slug: { $eq: slugVal } };
        } else if (typeof slugVal === 'object' && slugVal !== null) {
          where.store = { slug: slugVal };
        }
      }
    } else if (key === 'is_expired') {
      where.is_expired = value;
    } else if (key === 'is_featured') {
      where.is_featured = value;
    }
  }

  return where;
}

/**
 * Normalize an optional `country` query parameter to an ISO 3166-1 alpha-2 code.
 * - missing/blank/malformed → undefined (no country filtering)
 * - otherwise trimmed + uppercased (e.g. "us" → "US", " US " → "US")
 * Unknown-but-wellformed codes (e.g. "ZZ") are returned as-is: they match no
 * country-specific coupons, so only GLOBAL coupons remain eligible.
 */
export function normalizeCountryParam(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const code = Array.isArray(value) ? String(value[0] ?? '') : String(value);
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return undefined;
  return normalized;
}

/**
 * Additively apply country filtering to an existing coupon where clause.
 * - no code → base where is returned unchanged
 * - with code → GLOBAL coupons (empty countries relation) OR coupons whose
 *   countries relation contains the requested code, AND-composed with the
 *   existing filters so store/expiry/featured conditions still apply.
 */
export function withCountryFilter(baseWhere: any, countryCode: string | undefined): any {
  if (!countryCode) return baseWhere;
  return {
    $and: [
      baseWhere,
      {
        $or: [
          { countries: { code: { $eq: countryCode } } },
          { countries: { id: { $null: true } } },
        ],
      },
    ],
  };
}

function buildSort(sort: any): any {
  if (!sort || typeof sort !== 'object') return { createdAt: 'desc' };
  const result: any = {};
  for (const [key, value] of Object.entries(sort)) {
    result[key] = value;
  }
  return result;
}

export default factories.createCoreController('api::coupon.coupon', ({ strapi }) => ({
  async find(ctx) {
    const filters = buildWhere(ctx.query?.filters);
    // Optional country-aware filtering (GLOBAL + requested country).
    // Applied to the shared where clause so it composes with existing
    // filters AND is respected by both findMany and count (pagination).
    const where = withCountryFilter(filters, normalizeCountryParam(ctx.query?.country));
    const sort = buildSort(ctx.query?.sort);
    const pagination = ctx.query?.pagination as any || {};
    const page = parseInt(String(pagination.page), 10) || 1;
    const pageSize = parseInt(String(pagination.pageSize), 10) || 100;

    const entities = await strapi.db.query('api::coupon.coupon').findMany({
      where,
      populate: ['store', 'store.logo', 'categories'],
      orderBy: sort,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const total = await strapi.db.query('api::coupon.coupon').count({ where });

    return this.transformResponse(entities, {
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total,
      },
    });
  },

  async findFeatured(ctx) {
    const entities = await strapi.db.query('api::coupon.coupon').findMany({
      where: {
        is_featured: true,
        is_expired: false,
        publishedAt: { $notNull: true },
      },
      populate: ['store', 'store.logo', 'categories'],
      orderBy: { createdAt: 'desc' },
      limit: 20,
    });

    return this.transformResponse(entities);
  },

  async findTrending(ctx) {
    const entities = await strapi.db.query('api::coupon.coupon').findMany({
      where: {
        is_expired: false,
        publishedAt: { $notNull: true },
      },
      populate: ['store', 'store.logo', 'categories'],
      orderBy: [{ times_used: 'desc' }, { createdAt: 'desc' }],
      limit: 24,
    });

    return this.transformResponse(entities);
  },
}));
