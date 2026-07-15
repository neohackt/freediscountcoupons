import type { Core } from '@strapi/strapi';

const EXPIRED_COUPON_RETENTION_DAYS = 30;

async function deleteStaleExpiredCoupons(strapi: Core.Strapi) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - EXPIRED_COUPON_RETENTION_DAYS);

  const deleted = await strapi.db.query('api::coupon.coupon').deleteMany({
    where: {
      is_expired: true,
      expires_at: { $lt: cutoffDate.toISOString() },
    },
  });

  console.log(`[Coupon Cleanup] Deleted ${deleted.count} expired coupons older than ${EXPIRED_COUPON_RETENTION_DAYS} days`);
}

export default {
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
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