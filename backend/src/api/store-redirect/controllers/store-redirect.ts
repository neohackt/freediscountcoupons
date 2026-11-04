import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::store-redirect.store-redirect' as any, ({ strapi }: any) => ({
  async create(ctx) {
    const { destination_path } = ctx.request.body?.data || {};
    if (destination_path && !isValidLocalPath(destination_path)) {
      return ctx.badRequest('destination_path must be a safe local path (e.g., /)');
    }
    return super.create(ctx);
  },
  async update(ctx) {
    const { destination_path } = ctx.request.body?.data || {};
    if (destination_path && !isValidLocalPath(destination_path)) {
      return ctx.badRequest('destination_path must be a safe local path (e.g., /)');
    }
    return super.update(ctx);
  },
}));

function isValidLocalPath(path: string): boolean {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes('://');
}