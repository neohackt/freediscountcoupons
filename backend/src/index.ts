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

async function retryPendingRedirects(strapi: Core.Strapi) {
  try {
    const pending = await strapi.db.query('api::store-redirect.store-redirect').findMany({
      where: { is_pending: true },
    });
    if (!pending || pending.length === 0) {
      strapi.log?.info('[Retry] No pending redirects to process');
      return;
    }
    strapi.log?.info(`[Retry] Found ${pending.length} pending redirect(s)`);
    for (const record of pending) {
      try {
        // Verify the Store is actually deleted before activating the redirect.
        // Check by documentId (if available) AND by slug.
        // If a Store with the same slug or documentId still exists, do NOT activate.
        let storeExists = false;

        // Check by documentId first (most reliable)
        if (record.source_document_id) {
          const draftStore = await strapi.documents('api::store.store').findOne({
            documentId: record.source_document_id,
            status: 'draft',
          }).catch(() => null);
          const publishedStore = await strapi.documents('api::store.store').findOne({
            documentId: record.source_document_id,
            status: 'published',
          }).catch(() => null);
          if (draftStore || publishedStore) {
            storeExists = true;
            strapi.log?.warn(`[Retry] Store still exists (documentId=${record.source_document_id}). NOT activating redirect for slug=${record.source_slug}. Resolving pending state.`);
          }
        }

        // Also check by slug (handles recreation with same slug)
        if (!storeExists) {
          const storeBySlug = await strapi.db.query('api::store.store').findOne({
            where: { slug: record.source_slug },
          });
          if (storeBySlug) {
            storeExists = true;
            strapi.log?.warn(`[Retry] Store still exists (slug=${record.source_slug}). NOT activating redirect. Resolving pending state.`);
          }
        }

        if (storeExists) {
          // Store still exists — deactivate redirect and clear pending state
          // (the redirect should not be active for a live store)
          await strapi.db.query('api::store-redirect.store-redirect').update({
            where: { id: record.id },
            data: { is_active: false, is_pending: false },
          });
          strapi.log?.info(`[Retry] Resolved pending redirect for existing store: ${record.source_slug} (deactivated)`);
        } else {
          // Store is confirmed deleted — activate the redirect
          await strapi.db.query('api::store-redirect.store-redirect').update({
            where: { id: record.id },
            data: { is_active: true, is_pending: false },
          });
          strapi.log?.info(`[Retry] Activated pending redirect: ${record.source_slug} → /`);
        }
      } catch (err) {
        strapi.log?.error(`[Retry] Failed to process pending redirect id=${record.id} slug=${record.source_slug}: ${err}`);
      }
    }
  } catch (err) {
    strapi.log?.error(`[Retry] Failed to fetch pending redirects: ${err}`);
  }
}

async function seedStoreRedirects(strapi: Core.Strapi) {
  const slugs = ['shein-argentina', 'shein'];
  for (const slug of slugs) {
    try {
      const existing = await strapi.db.query('api::store-redirect.store-redirect').findOne({
        where: { source_slug: slug },
      });
      if (existing) {
        // Idempotent upsert: correct destination and status code, but NEVER change is_active
        // This preserves manually deactivated redirects and redirects deactivated after Store recreation
        await strapi.db.query('api::store-redirect.store-redirect').update({
          where: { id: existing.id },
          data: { destination_path: '/', status_code: 301 },
        });
        strapi.log?.info(`[Seed] Corrected redirect (is_active preserved): ${slug} → /`);
      } else {
        await strapi.db.query('api::store-redirect.store-redirect').create({
          data: { source_slug: slug, destination_path: '/', status_code: 301, is_active: true },
        });
        strapi.log?.info(`[Seed] Created redirect: ${slug} → /`);
      }
    } catch (err) {
      strapi.log?.error(`[Seed] Failed for ${slug}: ${err}`);
    }
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

    // Document Service middleware for Store publish/delete redirect handling
    strapi.documents.use(async (context: any, next: any) => {
      if (context.uid !== 'api::store.store') {
        return next();
      }

      // Handle publish action
      if (context.action === 'publish') {
        const result = await next();
        try {
          const documentId = context.params?.documentId;
          if (documentId) {
            const store = await strapi.documents('api::store.store').findOne({
              documentId,
              status: 'published',
            });
            if (store?.slug) {
              const existingRedirect = await strapi.db.query('api::store-redirect.store-redirect').findOne({
                where: { source_slug: store.slug },
              });
              if (existingRedirect?.is_active) {
                await strapi.db.query('api::store-redirect.store-redirect').update({
                  where: { id: existingRedirect.id },
                  data: { is_active: false },
                });
                strapi.log?.info(`[DS Middleware] Deactivated redirect for published store: ${store.slug}`);
                revalidationService.addRoutes('store', [{ slug: store.slug }]);
                revalidationService.addRoutes('storeRedirect', [{}]);
                await revalidationService.flush();
              }
            }
          }
        } catch (err) {
          strapi.log?.error(`[DS Middleware] Publish handling error: ${err}`);
        }
        return result;
      }

      // Handle delete action
      if (context.action === 'delete') {
        const documentId = context.params?.documentId;
        let slug: string | null = null;
        if (documentId) {
          try {
            const store = await strapi.documents('api::store.store').findOne({
              documentId,
              status: 'draft',
            });
            slug = store?.slug || null;
            if (!slug) {
              const publishedStore = await strapi.documents('api::store.store').findOne({
                documentId,
                status: 'published',
              });
              slug = publishedStore?.slug || null;
            }
          } catch (err) {
            strapi.log?.error(`[DS Middleware] Failed to capture slug for ${documentId}: ${err}`);
          }
        }

        // Step 1: Create a PENDING redirect record BEFORE deletion
        // This persists within the transaction. If the transaction rolls back,
        // the pending record is also rolled back (no orphaned pending records).
        // If the transaction commits but activation fails, the pending record survives.
        let pendingRedirectId: number | null = null;
        if (slug) {
          try {
            const existing = await strapi.db.query('api::store-redirect.store-redirect').findOne({
              where: { source_slug: slug },
            });
            if (existing) {
              // Reactivate as pending (don't change is_active yet)
              await strapi.db.query('api::store-redirect.store-redirect').update({
                where: { id: existing.id },
                data: { is_pending: true, source_document_id: documentId || null },
              });
              pendingRedirectId = existing.id;
            } else {
              const created = await strapi.db.query('api::store-redirect.store-redirect').create({
                data: { source_slug: slug, destination_path: '/', status_code: 301, is_active: false, is_pending: true, source_document_id: documentId || null },
              });
              pendingRedirectId = (created as any)?.id || null;
            }
            strapi.log?.info(`[DS Middleware] Created pending redirect for ${slug} (id=${pendingRedirectId})`);
          } catch (err) {
            strapi.log?.error(`[DS Middleware] FAILED to create pending redirect for slug="${slug}", documentId="${documentId}". Aborting deletion to prevent orphaned store without redirect. Error: ${err}`);
            throw err; // Prevent deletion — pending redirect is a prerequisite
          }
        } else {
          strapi.log?.warn(`[DS Middleware] Delete: could not capture slug for documentId=${documentId}`);
        }

        // Step 2: Execute deletion
        const result = await next();

        // Step 3: Activate redirect after successful deletion
        if (slug && pendingRedirectId) {
          try {
            await strapi.db.query('api::store-redirect.store-redirect').update({
              where: { id: pendingRedirectId },
              data: { is_active: true, is_pending: false },
            });
            strapi.log?.info(`[DS Middleware] Activated redirect for deleted store: ${slug} → /`);
            revalidationService.addRoutes('store', [{ slug }]);
            revalidationService.addRoutes('storeRedirect', [{}]);
            revalidationService.addRoutes('homepage', [{}]);
            revalidationService.addRoutes('sitemap', [{}]);
            await revalidationService.flush();
          } catch (err) {
            // Store is already deleted. Redirect activation failed.
            // The pending record survives for recovery on next startup.
            strapi.log?.error(`[DS Middleware] REDIRECT ACTIVATION FAILED for slug="${slug}", documentId="${documentId}", pendingId=${pendingRedirectId}. Store is deleted but redirect is NOT active. Recovery: on next Strapi startup, pending redirects will be retried. Manual recovery: update store-redirect record id=${pendingRedirectId} to set is_active=true, is_pending=false.`);
          }
        } else if (slug && !pendingRedirectId) {
          // Pending record creation failed — try direct creation
          try {
            const existing = await strapi.db.query('api::store-redirect.store-redirect').findOne({
              where: { source_slug: slug },
            });
            if (existing) {
              await strapi.db.query('api::store-redirect.store-redirect').update({
                where: { id: existing.id },
                data: { destination_path: '/', status_code: 301, is_active: true, is_pending: false },
              });
            } else {
              await strapi.db.query('api::store-redirect.store-redirect').create({
                data: { source_slug: slug, destination_path: '/', status_code: 301, is_active: true, is_pending: false },
              });
            }
            strapi.log?.info(`[DS Middleware] Created redirect for deleted store (fallback): ${slug} → /`);
          } catch (err) {
            strapi.log?.error(`[DS Middleware] REDIRECT CREATION FAILED (fallback) for slug="${slug}", documentId="${documentId}". Recovery: manually create a store-redirect record.`);
          }
        }

        return result;
      }

      return next();
    });

    // Seed store redirects for already-deleted stores (idempotent upsert)
    try {
      await seedStoreRedirects(strapi);
    } catch (err) {
      strapi.log?.error(`[Seed] Failed: ${err}`);
    }

    // Retry pending redirects from failed deletions
    try {
      await retryPendingRedirects(strapi);
    } catch (err) {
      strapi.log?.error(`[Retry] Failed: ${err}`);
    }

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
