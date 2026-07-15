/**
 * Category controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::category.category', ({ strapi }) => ({
  async findBySlug(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.db.query('api::category.category').findOne({
      where: { slug },
      populate: ['stores', 'coupons', 'parent'],
    });

    if (!entity) {
      return ctx.notFound('Category not found');
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },
}));