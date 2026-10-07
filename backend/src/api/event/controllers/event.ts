/**
 * Event controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::event.event', ({ strapi }) => ({
  async findActive(ctx) {
    const entities = await strapi.db.query('api::event.event').findMany({
      where: {
        isActive: true,
        publishedAt: { $notNull: true },
      },
      select: ['name', 'slug', 'sortOrder'],
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return this.transformResponse(entities);
  },

  async findBySlug(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.db.query('api::event.event').findOne({
      where: {
        slug,
        isActive: true,
        publishedAt: { $notNull: true },
      },
      populate: ['heroImage', 'ogImage', 'stores', 'stores.logo'],
    });

    if (!entity) {
      return ctx.notFound('Event not found');
    }

    return this.transformResponse(entity);
  },
}));
