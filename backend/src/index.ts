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

  const storeSlugs = [...new Set(affectedCoupons.map((c: any) => c.store?.slug).filter(Boolean))];

  const deleted = await strapi.db.query('api::coupon.coupon').deleteMany({
    where: {
      is_expired: true,
      expires_at: { $lt: cutoffDate.toISOString() },
    },
  });

  console.log(`[Coupon Cleanup] Deleted ${deleted.count} expired coupons older than ${EXPIRED_COUPON_RETENTION_DAYS} days`);

  // Touch affected stores' timestamps (bypasses lifecycle hooks since deleteMany doesn't trigger them)
  for (const storeSlug of storeSlugs) {
    try {
      await strapi.db.query('api::store.store').update({
        where: { slug: storeSlug },
        data: { last_content_updated_at: new Date().toISOString() },
      });
      strapi.log?.info(`[Coupon Cleanup] Touched store ${storeSlug} timestamp`);
    } catch (err) {
      strapi.log?.error(`[Coupon Cleanup] Failed to touch store ${storeSlug}: ${err}`);
    }
  }

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

async function backfillLastContentUpdatedAt(strapi: Core.Strapi) {
  let processed = 0;

  // Use offset 0 repeatedly since updating records removes them from the null result set
  while (true) {
    const stores = await strapi.db.query('api::store.store').findMany({
      where: { last_content_updated_at: { $null: true } },
      populate: ['coupons'],
      limit: 100,
      offset: 0,
    });

    if (!stores || stores.length === 0) break;

    for (const store of stores) {
      let latest = store.updatedAt || new Date().toISOString();
      for (const coupon of store.coupons || []) {
        if (coupon.updatedAt && new Date(coupon.updatedAt) > new Date(latest)) {
          latest = coupon.updatedAt;
        }
      }
      try {
        await strapi.db.query('api::store.store').update({
          where: { id: store.id },
          data: { last_content_updated_at: latest },
        });
        processed++;
      } catch (err) {
        strapi.log?.error(`[Backfill] Failed to update store ${store.id}: ${err}`);
      }
    }

    strapi.log?.info(`[Backfill] Processed ${processed} stores so far...`);

    if (stores.length < 100) break;
  }

  strapi.log?.info(`[Backfill] Complete. Updated ${processed} stores.`);
}

export default {
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    revalidationService.setStrapi(strapi);

    // Backfill last_content_updated_at for existing records
    try {
      await backfillLastContentUpdatedAt(strapi);
    } catch (err) {
      strapi.log?.error(`[Backfill] Failed: ${err}`);
    }

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
