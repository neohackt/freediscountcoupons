import { revalidationService } from '../../../../../utils/revalidation';

export default {
  async afterCreate(event: any) {
    const slug = event.params.data?.slug;
    const storeSlug = event.params.data?.store?.slug || event.params.data?.storeSlug;
    
    if (storeSlug) {
      revalidationService.addRoutes('coupon', [{ storeSlug, slug }]);
      revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },

  async afterUpdate(event: any) {
    const slug = event.result?.slug || event.params.data?.slug;
    const storeSlug = event.result?.store?.slug || event.params.data?.storeSlug || event.params.data?.store?.slug;
    
    if (storeSlug) {
      revalidationService.addRoutes('coupon', [{ storeSlug, slug }]);
      revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
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
        }
      }
    } else if (entries?.slug) {
      const storeSlug = entries.store?.slug;
      if (storeSlug) {
        revalidationService.addRoutes('coupon', [{ storeSlug, slug: entries.slug }]);
        revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      }
    }
    revalidationService.addRoutes('homepage', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async afterDelete(event: any) {
    const slug = event.result?.slug || event.params.where?.slug;
    const storeSlug = event.result?.store?.slug || event.params.where?.storeSlug;
    
    if (storeSlug) {
      revalidationService.addRoutes('coupon', [{ storeSlug, slug }]);
      revalidationService.addRoutes('store', [{ slug: storeSlug }]);
      revalidationService.addRoutes('homepage', [{}]);
      revalidationService.addRoutes('sitemap', [{}]);
      await revalidationService.flush();
    }
  },
};