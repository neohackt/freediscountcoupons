import { revalidationService } from '../../../../../utils/revalidation';

export default {
  async afterCreate(event: any) {
    const slug = event.params.data?.slug;
    if (slug) {
      revalidationService.addRoutes('category', [{ slug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },

  async afterUpdate(event: any) {
    const slug = event.result?.slug || event.params.data?.slug;
    if (slug) {
      revalidationService.addRoutes('category', [{ slug }]);
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
          revalidationService.addRoutes('category', [{ slug: entry.slug }]);
        }
      }
    } else if (entries?.slug) {
      revalidationService.addRoutes('category', [{ slug: entries.slug }]);
    }
    revalidationService.addRoutes('homepage', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async afterDelete(event: any) {
    const slug = event.result?.slug || event.params.where?.slug;
    if (slug) {
      revalidationService.addRoutes('category', [{ slug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },
};