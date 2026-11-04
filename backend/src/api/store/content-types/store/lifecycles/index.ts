import { marked } from 'marked';
import { revalidationService } from '../../../../../utils/revalidation';

function convertDescriptionToHtml(data: any) {
  if (data && data.description && typeof data.description === 'string') {
    data.description_html = marked.parse(data.description) as string;
  }
}

function convertEntityDescriptionToHtml(entry: any) {
  if (entry && entry.description && typeof entry.description === 'string') {
    entry.description_html = marked.parse(entry.description) as string;
  }
}

// Customer-visible content fields that trigger last_content_updated_at
const STORE_CONTENT_FIELDS = [
  'name', 'description', 'description_html', 'faqs',
  'seo_title', 'seo_description', 'aliases',
  'website_url', 'affiliate_url', 'country', 'currency',
  'is_popular', 'is_featured', 'logo',
];

async function fetchExistingStore(strapi: any, where: any) {
  try {
    return await strapi.db.query('api::store.store').findOne({ where });
  } catch (err) {
    strapi.log?.error(`[Store Lifecycle] Failed to fetch existing store: ${err}`);
    return null;
  }
}

function storeContentChanged(existing: any, newData: any): boolean {
  if (!existing) return true;
  for (const field of STORE_CONTENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(newData, field)) {
      if (JSON.stringify(existing[field]) !== JSON.stringify(newData[field])) {
        return true;
      }
    }
  }
  return false;
}

export default {
  beforeCreate(event: any) {
    convertDescriptionToHtml(event.params.data);
    event.params.data.last_content_updated_at = new Date().toISOString();
  },

  async beforeUpdate(event: any) {
    convertDescriptionToHtml(event.params.data);
    const newData = event.params.data || {};
    const where = event.params.where || {};

    try {
      const existing = await fetchExistingStore(strapi, where);
      if (storeContentChanged(existing, newData)) {
        event.params.data.last_content_updated_at = new Date().toISOString();
      }
    } catch (err) {
      strapi.log?.error(`[Store Lifecycle] beforeUpdate error: ${err}`);
      // Set timestamp to be safe
      event.params.data.last_content_updated_at = new Date().toISOString();
    }
  },

  beforePublish(event: any) {
    const entries = event.params?.entries || [event.entry];
    if (Array.isArray(entries)) {
      entries.forEach((entry: any) => {
        convertEntityDescriptionToHtml(entry);
      });
    } else {
      convertEntityDescriptionToHtml(entries);
    }
  },

  async afterCreate(event: any) {
    const slug = event.params.data?.slug;
    const status = event.params.data?.status || event.result?.status;

    // If store is created as published, deactivate any existing redirect
    if (slug && status === 'published') {
      try {
        const existingRedirect = await strapi.db.query('api::store-redirect.store-redirect').findOne({
          where: { source_slug: slug },
        });
        if (existingRedirect?.is_active) {
          await strapi.db.query('api::store-redirect.store-redirect').update({
            where: { id: existingRedirect.id },
            data: { is_active: false },
          });
          strapi.log?.info(`[Store Lifecycle] Deactivated redirect for published store (created as published): ${slug}`);
          revalidationService.addRoutes('storeRedirect', [{}]);
        }
      } catch (err) {
        strapi.log?.error(`[Store Lifecycle] Failed to deactivate redirect for ${slug}: ${err}`);
      }
    }

    if (slug) {
      revalidationService.addRoutes('store', [{ slug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },

  async afterUpdate(event: any) {
    const slug = event.result?.slug || event.params.data?.slug;
    if (slug) {
      revalidationService.addRoutes('store', [{ slug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },

  async afterPublish(event: any) {
    const entries = event.params?.entries || [event.entry];
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        if (entry.slug) {
          revalidationService.addRoutes('store', [{ slug: entry.slug }]);
        }
      }
    } else if (entries?.slug) {
      revalidationService.addRoutes('store', [{ slug: entries.slug }]);
    }
    revalidationService.addRoutes('homepage', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async beforeDelete(event: any) {
    const where = event.params.where || {};
    try {
      const existing = await strapi.db.query('api::store.store').findOne({ where });
      if (existing?.slug) {
        event.state = event.state || {};
        event.state.deletedSlug = existing.slug;
      }
    } catch (err) {
      strapi.log?.error(`[Store Lifecycle] beforeDelete error: ${err}`);
    }
  },

  async beforeDeleteMany(event: any) {
    const where = event.params.where || {};
    try {
      const stores = await strapi.db.query('api::store.store').findMany({ where });
      const slugs = stores.map((s: any) => s.slug).filter(Boolean);
      event.state = event.state || {};
      event.state.deletedSlugs = slugs;
    } catch (err) {
      strapi.log?.error(`[Store Lifecycle] beforeDeleteMany error: ${err}`);
    }
  },

  async afterDeleteMany(event: any) {
    // Revalidation only — redirect creation is handled by Document Service middleware
    const slugs = event.state?.deletedSlugs || [];
    if (slugs.length > 0) {
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },

  async afterDelete(event: any) {
    const slug = event.state?.deletedSlug || event.result?.slug || event.params.where?.slug;
    if (!slug) {
      strapi.log?.warn(`[Store Lifecycle] afterDelete: could not capture slug. event.state=${JSON.stringify(event.state)}, event.result=${JSON.stringify(event.result)}, event.params.where=${JSON.stringify(event.params.where)}`);
      return;
    }

    // Revalidation only — redirect creation is handled by Document Service middleware
    revalidationService.addRoutes('store', [{ slug }]);
    revalidationService.addRoutes('storeRedirect', [{}]);
    revalidationService.addRoutes('homepage', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

};
