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
    const sort = buildSort(ctx.query?.sort);
    const pagination = ctx.query?.pagination as any || {};
    const page = parseInt(String(pagination.page), 10) || 1;
    const pageSize = parseInt(String(pagination.pageSize), 10) || 100;

    const entities = await strapi.db.query('api::coupon.coupon').findMany({
      where: filters,
      populate: ['store', 'store.logo', 'categories'],
      orderBy: sort,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const total = await strapi.db.query('api::coupon.coupon').count({ where: filters });

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
