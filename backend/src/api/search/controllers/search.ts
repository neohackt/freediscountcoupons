export default {
  async index(ctx) {
    const q = ctx.query.q as string;
    if (!q || q.trim().length === 0) {
      return ctx.badRequest('Query parameter "q" is required');
    }

    const searchService = strapi.service('api::search.search');
    const results = await searchService.search(q.trim());

    return {
      data: results,
      meta: { total: results.stores.length + results.categories.length + results.coupons.length },
    };
  },

  async autocomplete(ctx) {
    const q = ctx.query.q as string;
    if (!q || q.trim().length < 2) {
      return { data: { stores: [], categories: [], coupons: [] } };
    }

    const searchService = strapi.service('api::search.search');
    const results = await searchService.autocomplete(q.trim());

    return { data: results };
  },
};
