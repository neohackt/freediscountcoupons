/**
 * Coupon controller
 */

import { factories } from '@strapi/strapi';
import { stripPaidTrafficFields } from '../../../utils/sanitize';

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
 * - valid 2-letter format → trimmed + uppercased (e.g. "us" → "US", " US " → "US")
 *   The caller must validate existence against the Country collection.
 */
export function normalizeCountryParam(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const code = Array.isArray(value) ? String(value[0] ?? '') : String(value);
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return undefined;
  return normalized;
}

/**
 * Normalize an optional `scope` query parameter.
 * - missing/blank → undefined (no scope filter)
 * - 'global' (case-insensitive) → 'global'
 * - anything else → throws Error (caller converts to HTTP 400)
 */
export function normalizeScopeParam(value: unknown): 'global' | undefined {
  if (value === undefined || value === null) return undefined;
  const scope = Array.isArray(value) ? String(value[0] ?? '') : String(value);
  const normalized = scope.trim().toLowerCase();
  if (normalized === '') return undefined;
  if (normalized === 'global') return 'global';
  throw new Error(`Invalid scope: "${scope}". Supported values: global`);
}

/**
 * Add strict country filtering to an existing coupon where clause.
 * - no code → base where is returned unchanged
 * - with code → only coupons whose countries relation contains the requested
 *   code match. Global coupons (empty countries relation) are excluded.
 */
export function withCountryFilter(baseWhere: any, countryCode: string | undefined): any {
  if (!countryCode) return baseWhere;
  return {
    $and: [
      baseWhere,
      {
        countries: {
          code: {
            $eq: countryCode,
          },
        },
      },
    ],
  };
}

/**
 * Add explicit Global filtering to an existing coupon where clause.
 * Global means the coupon has no associated Country records.
 */
export function withGlobalFilter(baseWhere: any): any {
  return {
    $and: [
      baseWhere,
      {
        countries: {
          id: {
            $null: true,
          },
        },
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

/**
 * List populate for GET /api/coupons. Object form is REQUIRED here: the
 * db-layer populate parser calls `.split('.')` on every array entry, so a
 * nested object inside an array crashes every request (TypeError). The
 * db layer also only honors `select` (not entityService-style `fields`).
 * Exposes only `countries.code` alongside the pre-existing relations.
 */
export const COUPON_LIST_POPULATE = {
  store: { populate: ['logo'] },
  categories: true,
  countries: { select: ['code'] },
};

export default factories.createCoreController('api::coupon.coupon', ({ strapi }) => ({
  async find(ctx) {
    const filters = buildWhere(ctx.query?.filters);

    // Parse and validate country + scope parameters.
    const countryRaw = ctx.query?.country;
    const countryParam = normalizeCountryParam(countryRaw);

    // A provided country that fails normalization (malformed) is invalid → 400.
    if (
      countryRaw !== undefined &&
      countryRaw !== null &&
      String(countryRaw).trim() !== '' &&
      countryParam === undefined
    ) {
      ctx.throw(400, `Invalid country: "${countryRaw}". Must be a valid ISO 3166-1 alpha-2 code.`);
    }

    let scope: 'global' | undefined;
    try {
      scope = normalizeScopeParam(ctx.query?.scope);
    } catch (error) {
      ctx.throw(400, error instanceof Error ? error.message : 'Invalid scope parameter.');
    }

    // Reject conflicting country + global scope.
    if (countryParam && scope === 'global') {
      ctx.throw(400, 'Cannot combine country and scope=global parameters.');
    }

    let where = filters;

    // Validate country existence against the Country collection, then apply strict filter.
    if (countryParam) {
      const countries = await strapi.documents('api::country.country').findMany({
        filters: { code: { $eq: countryParam } },
        status: 'published',
      });
      if (!Array.isArray(countries) || countries.length === 0) {
        ctx.throw(400, `Country not found: ${countryParam}`);
      }
      where = withCountryFilter(where, countryParam);
    }

    // Apply Global filter (empty countries relation).
    if (scope === 'global') {
      where = withGlobalFilter(where);
    }

    const sort = buildSort(ctx.query?.sort);
    const pagination = ctx.query?.pagination as any || {};
    const page = parseInt(String(pagination.page), 10) || 1;
    const pageSize = parseInt(String(pagination.pageSize), 10) || 100;

    const entities = await strapi.db.query('api::coupon.coupon').findMany({
      where,
      populate: COUPON_LIST_POPULATE,
      orderBy: sort,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    // Strip paid-traffic configuration from nested store objects
    for (const entity of entities) {
      stripPaidTrafficFields(entity);
    }

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

    // Strip paid-traffic configuration from nested store objects
    for (const entity of entities) {
      stripPaidTrafficFields(entity);
    }

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

    // Strip paid-traffic configuration from nested store objects
    for (const entity of entities) {
      stripPaidTrafficFields(entity);
    }

    return this.transformResponse(entities);
  },
}));
