export default {
  routes: [
    {
      method: 'GET',
      path: '/stores',
      handler: 'store.find',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/stores/similar/:slug',
      handler: 'store.findSimilar',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/stores/:id',
      handler: 'store.findOne',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/stores/slug/:slug',
      handler: 'store.findBySlug',
      config: { auth: false },
    },
  ],
};