import { revalidationService } from '../../../../../utils/revalidation';

export default {
  async afterCreate(event: any) {
    revalidationService.addRoutes('author', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async afterUpdate(event: any) {
    revalidationService.addRoutes('author', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async afterPublish(event: any) {
    revalidationService.addRoutes('author', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },

  async afterDelete(event: any) {
    revalidationService.addRoutes('author', [{}]);
    revalidationService.addRoutes('sitemap', [{}]);
    await revalidationService.flush();
  },
};