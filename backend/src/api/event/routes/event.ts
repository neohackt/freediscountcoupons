export default {
  routes: [
    {
      method: 'GET',
      path: '/events/active',
      handler: 'event.findActive',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/events/slug/:slug',
      handler: 'event.findBySlug',
      config: { auth: false },
    },
  ],
};
