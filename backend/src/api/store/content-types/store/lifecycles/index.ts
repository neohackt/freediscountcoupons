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

  async afterDelete(event: any) {
    const slug = event.result?.slug || event.params.where?.slug;
    if (slug) {
      revalidationService.addRoutes('store', [{ slug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },
};
