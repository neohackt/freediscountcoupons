import { revalidationService } from '../../../../../utils/revalidation';

// Customer-visible coupon content fields (excludes analytics: times_used, success_rate)
const COUPON_CONTENT_FIELDS = [
  'title', 'description', 'code', 'discount_type', 'discount_value',
  'currency', 'discount_text', 'affiliate_url', 'verified', 'verified_at',
  'expires_at', 'is_featured', 'is_expired',
];

// Relationship fields (compared by stable IDs, not JSON shapes)
const COUPON_RELATION_FIELDS = ['store', 'categories', 'countries'];

function normalizeRelationIds(value: any): string {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.map((v: any) => String(v?.id ?? v?.documentId ?? v)).sort().join(',');
  }
  return String(value?.id ?? value?.documentId ?? value);
}

function couponContentChanged(existing: any, newData: any): boolean {
  if (!existing) return true;

  // Check scalar content fields
  for (const field of COUPON_CONTENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(newData, field)) {
      if (JSON.stringify(existing[field]) !== JSON.stringify(newData[field])) {
        return true;
      }
    }
  }

  // Check relationship fields by stable IDs
  for (const field of COUPON_RELATION_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(newData, field)) {
      const existingIds = normalizeRelationIds(existing[field]);
      const newIds = normalizeRelationIds(newData[field]);
      if (existingIds !== newIds) {
        return true;
      }
    }
  }

  return false;
}

async function fetchExistingCoupon(strapi: any, where: any) {
  try {
    return await strapi.db.query('api::coupon.coupon').findOne({
      where,
      populate: ['store'],
    });
  } catch (err) {
    strapi.log?.error(`[Coupon Lifecycle] Failed to fetch existing coupon: ${err}`);
    return null;
  }
}

async function touchStoreTimestamp(strapi: any, storeIdOrSlug: any, operation: string) {
  if (!storeIdOrSlug) return;
  try {
    let storeId = storeIdOrSlug;
    if (typeof storeIdOrSlug === 'string') {
      const store = await strapi.db.query('api::store.store').findOne({
        where: { slug: storeIdOrSlug },
        select: ['id'],
      });
      storeId = store?.id;
    }
    if (storeId) {
      // Use db.query().update() to bypass lifecycle hooks (no recursion)
      await strapi.db.query('api::store.store').update({
        where: { id: storeId },
        data: { last_content_updated_at: new Date().toISOString() },
      });
      strapi.log?.info(`[Coupon Lifecycle] Touched store ${storeId} timestamp (${operation})`);
    }
  } catch (err) {
    strapi.log?.error(`[Coupon Lifecycle] Failed to touch store timestamp: ${err}`);
  }
}

export default {
  // beforeUpdate: capture previous state for comparison and store reassignment
  async beforeUpdate(event: any) {
    const where = event.params.where || {};
    try {
      const existing = await fetchExistingCoupon(strapi, where);
      if (existing) {
        event.state = event.state || {};
        event.state.previousStoreSlug = existing.store?.slug || null;
        event.state.previousStoreId = existing.store?.id || null;
        event.state.previousCouponContent = {};
        for (const field of [...COUPON_CONTENT_FIELDS, ...COUPON_RELATION_FIELDS]) {
          event.state.previousCouponContent[field] = existing[field];
        }
      }
    } catch (err) {
      strapi.log?.error(`[Coupon Lifecycle] beforeUpdate error: ${err}`);
    }
  },

  // beforeDelete: capture store info before deletion
  async beforeDelete(event: any) {
    const where = event.params.where || {};
    try {
      const existing = await fetchExistingCoupon(strapi, where);
      if (existing) {
        event.state = event.state || {};
        event.state.deletedStoreSlug = existing.store?.slug || null;
        event.state.deletedStoreId = existing.store?.id || null;
      }
    } catch (err) {
      strapi.log?.error(`[Coupon Lifecycle] beforeDelete error: ${err}`);
    }
  },

  async afterCreate(event: any) {
    const slug = event.params.data?.slug;
    const storeSlug = event.params.data?.store?.slug || event.params.data?.storeSlug;
    const storeId = event.params.data?.store?.id || event.params.data?.storeId;

    if (storeSlug) {
      revalidationService.addRoutes('coupon', [{ storeSlug, slug }]);
      revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }

    // New coupon = content change → touch store timestamp
    await touchStoreTimestamp(strapi, storeSlug || storeId, 'create');
  },

  async afterUpdate(event: any) {
    const slug = event.result?.slug || event.params.data?.slug;
    const storeSlug = event.result?.store?.slug || event.params.data?.storeSlug || event.params.data?.store?.slug;
    const storeId = event.result?.store?.id || event.params.data?.store?.id;
    const previousStoreSlug = event.state?.previousStoreSlug;
    const previousCouponContent = event.state?.previousCouponContent;

    // Compare actual old vs new values
    const newData = event.params.data || {};
    const contentChanged = couponContentChanged(previousCouponContent, newData);

    if (storeSlug) {
      revalidationService.addRoutes('coupon', [{ storeSlug, slug }]);
      revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }

    // Touch store timestamp only if content actually changed
    if (contentChanged) {
      await touchStoreTimestamp(strapi, storeSlug || storeId, 'update');
    }

    // Handle store reassignment: touch previous store too
    if (previousStoreSlug && previousStoreSlug !== storeSlug) {
      await touchStoreTimestamp(strapi, previousStoreSlug, 'reassignment');
      // Revalidate previous store page
      revalidationService.addRoutes('store', [{ slug: previousStoreSlug }]);
      await revalidationService.flush();
    }
  },

  async afterPublish(event: any) {
    const entries = event.params?.entries || [event.entry];
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const storeSlug = entry.store?.slug;
        if (entry.slug && storeSlug) {
          revalidationService.addRoutes('coupon', [{ storeSlug, slug: entry.slug }]);
          revalidationService.addRoutes('store', [{ slug: storeSlug }]);
          await touchStoreTimestamp(strapi, storeSlug, 'publish');
        }
      }
    } else if (entries?.slug) {
      const storeSlug = entries.store?.slug;
      if (storeSlug) {
        revalidationService.addRoutes('coupon', [{ storeSlug, slug: entries.slug }]);
        revalidationService.addRoutes('store', [{ slug: storeSlug }]);
        await touchStoreTimestamp(strapi, storeSlug, 'publish');
      }
    }
    revalidationService.addRoutes('homepage', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async afterUnpublish(event: any) {
    const entries = event.params?.entries || [event.entry];
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const storeSlug = entry.store?.slug;
        if (entry.slug && storeSlug) {
          revalidationService.addRoutes('coupon', [{ storeSlug, slug: entry.slug }]);
          revalidationService.addRoutes('store', [{ slug: storeSlug }]);
          await touchStoreTimestamp(strapi, storeSlug, 'unpublish');
        }
      }
    } else if (entries?.slug) {
      const storeSlug = entries.store?.slug;
      if (storeSlug) {
        revalidationService.addRoutes('coupon', [{ storeSlug, slug: entries.slug }]);
        revalidationService.addRoutes('store', [{ slug: storeSlug }]);
        await touchStoreTimestamp(strapi, storeSlug, 'unpublish');
      }
    }
    revalidationService.addRoutes('homepage', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async afterDelete(event: any) {
    const slug = event.result?.slug || event.params.where?.slug;
    const storeSlug = event.state?.deletedStoreSlug || event.result?.store?.slug || event.params.where?.storeSlug;

    if (storeSlug) {
      revalidationService.addRoutes('coupon', [{ storeSlug, slug }]);
      revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }

    // Touch store timestamp on delete (using captured state)
    await touchStoreTimestamp(strapi, storeSlug, 'delete');
  },
};
