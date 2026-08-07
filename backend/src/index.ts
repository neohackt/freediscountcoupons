import type { Core } from '@strapi/strapi';
import { revalidationService } from './utils/revalidation';

const EXPIRED_COUPON_RETENTION_DAYS = 30;

async function deleteStaleExpiredCoupons(strapi: Core.Strapi) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - EXPIRED_COUPON_RETENTION_DAYS);

  // First, get the affected store slugs before deleting
  const affectedCoupons = await strapi.db.query('api::coupon.coupon').findMany({
    where: {
      is_expired: true,
      expires_at: { $lt: cutoffDate.toISOString() },
    },
    populate: { store: { fields: ['slug'] } },
  });

  const storeSlugs = [...new Set(affectedCoupons.map(c => c.store?.slug).filter(Boolean))];

  const deleted = await strapi.db.query('api::coupon.coupon').deleteMany({
    where: {
      is_expired: true,
      expires_at: { $lt: cutoffDate.toISOString() },
    },
  });

  console.log(`[Coupon Cleanup] Deleted ${deleted.count} expired coupons older than ${EXPIRED_COUPON_RETENTION_DAYS} days`);

  // Revalidate affected store pages
  if (storeSlugs.length > 0) {
    revalidationService.setStrapi(strapi);
    for (const storeSlug of storeSlugs) {
      revalidationService.addRoutes('store', [{ slug: storeSlug }]);
    }
    revalidationService.addRoutes('homepage', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  }
}

export default {
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    revalidationService.setStrapi(strapi);

    strapi.cron.add({
      'coupon-cleanup': {
        task: async () => {
          await deleteStaleExpiredCoupons(strapi);
        },
        options: '0 3 * * *',
      },
    });

    console.log('[Coupon Cleanup] Scheduled daily at 3:00 AM UTC');
  },
};