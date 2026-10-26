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
    {
      method: 'GET',
      path: '/stores/slug/:slug/country-markets',
      handler: 'store.countryMarkets',
      config: { auth: false },
    },
    {
      // Server-to-server only: returns a store's paid-traffic configuration.
      // Protected by a shared secret so the brand tracking URL template is
      // not publicly readable.
      method: 'GET',
      path: '/stores/slug/:slug/paid-traffic',
      handler: 'store.paidTrafficConfig',
      config: {
        auth: false,
        policies: ['global::require-paid-traffic-secret'],
      },
    },
  ],
};