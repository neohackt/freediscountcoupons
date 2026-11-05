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

/**
 * Resolve a coupon's persisted store/categories/countries by a where clause.
 * Returns { ok: false } on lookup failure or not-found so callers can
 * distinguish "no relation" (ok:true with nulls) from "unknown" (ok:false).
 * Never trust relation payloads from event.params.data.
 */
export async function resolveCouponRelations(strapi: any, where: any): Promise<{
  ok: boolean;
  publishedAt?: string | null;
  storeId?: number | null;
  storeSlug?: string | null;
  categoryIds?: number[];
  categorySlugs?: string[];
  countryCodes?: string[];
}> {
  try {
    const existing = await strapi.db.query('api::coupon.coupon').findOne({
      where: where || {},
      populate: ['store', 'categories', 'countries'],
      select: ['publishedAt', 'store', 'categories', 'countries'],
    });
    if (!existing) {
      // Query succeeded but no row — treat as "captured, no relations".
      return { ok: true, publishedAt: null, storeId: null, storeSlug: null, categoryIds: [], categorySlugs: [], countryCodes: [] };
    }
    // A populated relation is always an object; a plain documentId string must
    // never be mistaken for a populated relationship.
    const store = (existing.store && typeof existing.store === 'object' && !Array.isArray(existing.store))
      ? existing.store
      : null;
    const categories = Array.isArray(existing.categories)
      ? existing.categories.filter((c: any) => c && typeof c === 'object')
      : [];
    const countries = Array.isArray(existing.countries)
      ? existing.countries.filter((c: any) => c && typeof c === 'object')
      : [];
    return {
      ok: true,
      publishedAt: existing.publishedAt ?? null,
      storeId: store?.id ?? null,
      storeSlug: store?.slug ?? null,
      categoryIds: categories.map((c: any) => c.id).filter((v: any) => v != null),
      categorySlugs: categories.map((c: any) => c.slug).filter(Boolean),
      countryCodes: countries.map((c: any) => c.code).filter(Boolean),
    };
  } catch (err) {
    strapi?.log?.error?.(`[Coupon Lifecycle] resolveCouponRelations failed: ${err}`);
    return { ok: false };
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
      strapi.log?.info?.(`[Coupon Lifecycle] Touched store ${storeId} timestamp (${operation})`);
    }
  } catch (err) {
    strapi.log?.error?.(`[Coupon Lifecycle] Failed to touch store timestamp: ${err}`);
  }
}

/**
 * Resolve store slugs from a list of store ids. Returns null if any lookup fails
 * so the caller can fall back to full invalidation.
 */
async function storeSlugsFromIds(strapi: any, ids: number[]): Promise<string[] | null> {
  const slugs: string[] = [];
  for (const id of ids) {
    try {
      const store = await strapi.db.query('api::store.store').findOne({
        where: { id },
        select: ['slug'],
      });
      if (store?.slug) slugs.push(store.slug);
    } catch (err) {
      strapi?.log?.error?.(`[Coupon Lifecycle] Failed to resolve store ${id}: ${err}`);
      return null;
    }
  }
  return slugs;
}

/**
 * Resolve category slugs from a list of category ids. Returns null on failure.
 */
async function categorySlugsFromIds(strapi: any, ids: number[]): Promise<string[] | null> {
  const slugs: string[] = [];
  for (const id of ids) {
    try {
      const cat = await strapi.db.query('api::category.category').findOne({
        where: { id },
        select: ['slug'],
      });
      if (cat?.slug) slugs.push(cat.slug);
    } catch (err) {
      strapi?.log?.error?.(`[Coupon Lifecycle] Failed to resolve category ${id}: ${err}`);
      return null;
    }
  }
  return slugs;
}

export async function revalidationFallbackAll(strapi: any, revalidation: any): Promise<void> {
  try {
    const stores = await strapi.db.query('api::store.store').findMany({
      where: { publishedAt: { $notNull: true } },
      select: ['slug'],
    });
    const categories = await strapi.db.query('api::category.category').findMany({
      where: { publishedAt: { $notNull: true } },
      select: ['slug'],
    });
    revalidation.addRoutes('store', (stores || []).map((s: any) => ({ slug: s.slug })).filter((x: any) => x.slug));
    revalidation.addRoutes('category', (categories || []).map((c: any) => ({ slug: c.slug })).filter((x: any) => x.slug));
  } catch (err) {
    strapi?.log?.error?.(`[Coupon Lifecycle] Fallback enumeration failed: ${err}`);
  }
  // Dynamic route patterns cover previously deleted/unpublished stores & categories
  // whose concrete slugs can no longer be enumerated.
  revalidation.addPaths(['/store/[slug]', '/browse/[slug]']);
  revalidation.addRoutes('homepage', [{}]);
  revalidation.addRoutes('sitemap', [{}]);
  await revalidation.flush();
}

export async function revalidateStoresAndCategories(
  strapi: any,
  revalidation: any,
  storeSlugs: string[],
  categorySlugs: string[]
): Promise<void> {
  if (storeSlugs.length) {
    revalidation.addRoutes('store', storeSlugs.map((slug) => ({ slug })));
  }
  if (categorySlugs.length) {
    revalidation.addRoutes('category', categorySlugs.map((slug) => ({ slug })));
  }
  revalidation.addRoutes('homepage', [{}]);
  revalidation.addRoutes('sitemap', [{}]);
  await revalidation.flush();
}

export default {
  // beforeUpdate: capture previous state for comparison and store reassignment
  async beforeUpdate(event: any) {
    const where = event?.params?.where || {};
    try {
      const resolved = await resolveCouponRelations(strapi, where);
      event.state = event.state || {};
      event.state.captured = resolved.ok;
      if (resolved.ok) {
        event.state.previousPublishedAt = resolved.publishedAt ?? null;
        event.state.previousStoreId = resolved.storeId ?? null;
        event.state.previousStoreSlug = resolved.storeSlug ?? null;
        event.state.previousCategoryIds = resolved.categoryIds || [];
        event.state.previousCategorySlugs = resolved.categorySlugs || [];
        event.state.previousCouponContent = {};
        // Re-fetch full existing for content comparison (resolveCouponRelations selects relations only)
        try {
          const full = await strapi.db.query('api::coupon.coupon').findOne({
            where,
            populate: ['store', 'categories', 'countries'],
          });
          for (const field of [...COUPON_CONTENT_FIELDS, ...COUPON_RELATION_FIELDS]) {
            event.state.previousCouponContent[field] = full ? full[field] : undefined;
          }
        } catch (err) {
          strapi.log?.error?.(`[Coupon Lifecycle] beforeUpdate content fetch failed: ${err}`);
        }
      } else {
        // Unknown state — leave captured=false; do not assume anything.
        event.state.previousPublishedAt = undefined;
        event.state.previousStoreId = undefined;
        event.state.previousStoreSlug = undefined;
        event.state.previousCategoryIds = undefined;
        event.state.previousCategorySlugs = undefined;
        event.state.previousCouponContent = undefined;
      }
    } catch (err) {
      strapi.log?.error?.(`[Coupon Lifecycle] beforeUpdate error: ${err}`);
      event.state = event.state || {};
      event.state.captured = false;
    }
  },

  // beforeDelete: capture store/categories before deletion
  async beforeDelete(event: any) {
    const where = event?.params?.where || {};
    try {
      const resolved = await resolveCouponRelations(strapi, where);
      event.state = event.state || {};
      event.state.captured = resolved.ok;
      if (resolved.ok) {
        event.state.deletedStoreId = resolved.storeId ?? null;
        event.state.deletedStoreSlug = resolved.storeSlug ?? null;
        event.state.deletedCategoryIds = resolved.categoryIds || [];
        event.state.deletedCategorySlugs = resolved.categorySlugs || [];
        event.state.deletedPublishedAt = resolved.publishedAt ?? null;
      } else {
        event.state.deletedStoreId = undefined;
        event.state.deletedStoreSlug = undefined;
        event.state.deletedCategoryIds = undefined;
        event.state.deletedCategorySlugs = undefined;
        event.state.deletedPublishedAt = undefined;
      }
    } catch (err) {
      strapi.log?.error?.(`[Coupon Lifecycle] beforeDelete error: ${err}`);
      event.state = event.state || {};
      event.state.captured = false;
    }
  },

  async afterCreate(event: any) {
    try {
      // Resolve persisted relations — event.result may carry only a documentId
      // string for store, so re-fetch to be safe.
      let storeSlug: string | null = null;
      let storeId: number | null = null;
      let categorySlugs: string[] = [];
      // Resolve the persisted row by a stable identifier. event.result may carry
      // only a documentId (string) for relations, so we never trust those; we
      // re-fetch by id/documentId to obtain populated store/categories.
      const result = event?.result || {};
      const where =
        result.id != null ? { id: result.id }
        : result.documentId ? { documentId: result.documentId }
        : (event?.params?.where || null);
      if (!where) {
        // Cannot safely resolve the persisted row — invalidate everything.
        await revalidationFallbackAll(strapi, revalidationService);
        return;
      }
      const resolved = await resolveCouponRelations(strapi, where);
      if (resolved.ok) {
        storeSlug = resolved.storeSlug ?? null;
        storeId = resolved.storeId ?? null;
        categorySlugs = resolved.categorySlugs || [];
      } else {
        // Unknown — fall back to invalidating everything.
        await revalidationFallbackAll(strapi, revalidationService);
        return;
      }

      if (storeSlug) {
        revalidationService.addRoutes('coupon', [{ storeSlug, slug: event?.result?.slug }]);
        revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      }
      for (const catSlug of categorySlugs) {
        revalidationService.addRoutes('category', [{ slug: catSlug }]);
      }
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();

      // New coupon = content change → touch store timestamp
      await touchStoreTimestamp(strapi, storeSlug || storeId, 'create');
    } catch (err) {
      strapi.log?.error?.(`[Coupon Lifecycle] afterCreate error: ${err}`);
      await revalidationFallbackAll(strapi, revalidationService);
    }
  },

  async afterUpdate(event: any) {
    try {
      const where = event?.params?.where || {};
      const previousCaptured = event?.state?.captured === true;
      const previousStoreId = event?.state?.previousStoreId;
      const previousStoreSlug = event?.state?.previousStoreSlug;
      const previousCategoryIds = Array.isArray(event?.state?.previousCategoryIds) ? event.state.previousCategoryIds : [];
      const previousCategorySlugs = Array.isArray(event?.state?.previousCategorySlugs) ? event.state.previousCategorySlugs : [];
      const previousCouponContent = event?.state?.previousCouponContent;

      const newData = event?.params?.data || {};
      const contentChanged = couponContentChanged(previousCouponContent, newData);

      // Resolve final persisted relations (never trust event.result.* or params.data.*)
      const finalResolved = await resolveCouponRelations(strapi, where);
      if (!finalResolved.ok) {
        await revalidationFallbackAll(strapi, revalidationService);
        await touchStoreTimestamp(strapi, previousStoreSlug, 'update');
        return;
      }

      const finalStoreSlug = finalResolved.storeSlug ?? null;
      const finalStoreId = finalResolved.storeId ?? null;
      const finalCategorySlugs = finalResolved.categorySlugs || [];

      // Collect old + new store slugs
      const oldStoreSlugs: string[] = [];
      if (previousCaptured) {
        if (previousStoreSlug) oldStoreSlugs.push(previousStoreSlug);
        else if (previousStoreId != null) {
          const resolved = await storeSlugsFromIds(strapi, [previousStoreId]);
          if (resolved === null) {
            await revalidationFallbackAll(strapi, revalidationService);
            await touchStoreTimestamp(strapi, finalStoreSlug || finalStoreId, 'update');
            return;
          }
          oldStoreSlugs.push(...resolved);
        }
      }

      const newStoreSlugs = finalStoreSlug ? [finalStoreSlug] : [];
      const allStoreSlugs = Array.from(new Set([...oldStoreSlugs, ...newStoreSlugs].filter(Boolean)));

      // Collect old + new category slugs
      const oldCategorySlugs: string[] = previousCaptured ? [...previousCategorySlugs] : [];
      if (previousCaptured && oldCategorySlugs.length === 0 && previousCategoryIds.length) {
        const resolved = await categorySlugsFromIds(strapi, previousCategoryIds);
        if (resolved === null) {
          await revalidationFallbackAll(strapi, revalidationService);
          await touchStoreTimestamp(strapi, finalStoreSlug || finalStoreId, 'update');
          return;
        }
        oldCategorySlugs.push(...resolved);
      }
      const allCategorySlugs = Array.from(new Set([...oldCategorySlugs, ...finalCategorySlugs].filter(Boolean)));

      if (allStoreSlugs.length || allCategorySlugs.length) {
        await revalidateStoresAndCategories(strapi, revalidationService, allStoreSlugs, allCategorySlugs);
      } else if (!previousCaptured) {
        // Unknown previous state — safest is to invalidate everything.
        await revalidationFallbackAll(strapi, revalidationService);
      }

      const slug = event?.result?.slug || newData?.slug;
      if (finalStoreSlug && slug) {
        revalidationService.addRoutes('coupon', [{ storeSlug: finalStoreSlug, slug }]);
        await revalidationService.flush();
      }

      // Touch store timestamp only if content actually changed
      if (contentChanged) {
        await touchStoreTimestamp(strapi, finalStoreSlug || finalStoreId, 'update');
      }
      // Handle store reassignment: touch previous store too
      if (previousCaptured && previousStoreSlug && previousStoreSlug !== finalStoreSlug) {
        await touchStoreTimestamp(strapi, previousStoreSlug, 'reassignment');
      }
    } catch (err) {
      strapi.log?.error?.(`[Coupon Lifecycle] afterUpdate error: ${err}`);
      await revalidationFallbackAll(strapi, revalidationService);
    }
  },

  async afterPublish(event: any) {
    // Not emitted by @strapi/database 5.50.1 (verified). Retained as a
    // defensive no-op; real publish handling lives in afterCreate.
    strapi?.log?.debug?.('[Coupon Lifecycle] afterPublish is not wired in this Strapi version; skipping.');
  },

  async afterUnpublish(event: any) {
    // Not emitted by @strapi/database 5.50.1 (verified). Retained as a
    // defensive no-op; real unpublish handling lives in afterDelete.
    strapi?.log?.debug?.('[Coupon Lifecycle] afterUnpublish is not wired in this Strapi version; skipping.');
  },

  async afterDelete(event: any) {
    try {
      const captured = event?.state?.captured === true;
      const previousStoreSlug = event?.state?.deletedStoreSlug;
      const previousStoreId = event?.state?.deletedStoreId;
      const previousCategoryIds = Array.isArray(event?.state?.deletedCategoryIds) ? event.state.deletedCategoryIds : [];
      const previousCategorySlugs = Array.isArray(event?.state?.deletedCategorySlugs) ? event.state.deletedCategorySlugs : [];

      const oldStoreSlugs: string[] = [];
      if (captured) {
        if (previousStoreSlug) oldStoreSlugs.push(previousStoreSlug);
        else if (previousStoreId != null) {
          const resolved = await storeSlugsFromIds(strapi, [previousStoreId]);
          if (resolved === null) {
            await revalidationFallbackAll(strapi, revalidationService);
            await touchStoreTimestamp(strapi, previousStoreSlug || previousStoreId, 'delete');
            return;
          }
          oldStoreSlugs.push(...resolved);
        }
      }

      const oldCategorySlugs: string[] = captured ? [...previousCategorySlugs] : [];
      if (captured && oldCategorySlugs.length === 0 && previousCategoryIds.length) {
        const resolved = await categorySlugsFromIds(strapi, previousCategoryIds);
        if (resolved === null) {
          await revalidationFallbackAll(strapi, revalidationService);
          await touchStoreTimestamp(strapi, previousStoreSlug || previousStoreId, 'delete');
          return;
        }
        oldCategorySlugs.push(...resolved);
      }

      if (captured && (oldStoreSlugs.length || oldCategorySlugs.length)) {
        await revalidateStoresAndCategories(strapi, revalidationService, oldStoreSlugs, oldCategorySlugs);
      } else {
        // Unknown previous state — invalidate everything potentially affected.
        await revalidationFallbackAll(strapi, revalidationService);
      }

      const slug = event?.result?.slug || event?.params?.where?.slug;
      if (oldStoreSlugs.length && slug) {
        revalidationService.addRoutes('coupon', [{ storeSlug: oldStoreSlugs[0], slug }]);
        await revalidationService.flush();
      }

      await touchStoreTimestamp(strapi, oldStoreSlugs[0] || previousStoreSlug || previousStoreId, 'delete');
    } catch (err) {
      strapi.log?.error?.(`[Coupon Lifecycle] afterDelete error: ${err}`);
      await revalidationFallbackAll(strapi, revalidationService);
    }
  },
};