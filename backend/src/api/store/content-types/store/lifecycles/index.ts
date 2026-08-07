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

export default {
  beforeCreate(event: any) {
    convertDescriptionToHtml(event.params.data);
  },

  beforeUpdate(event: any) {
    convertDescriptionToHtml(event.params.data);
  },

  beforePublish(event: any) {
    // Strapi v5 admin "Publish" triggers this lifecycle
    // Regenerate description_html from description before publishing
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
    // Revalidate after publishing
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