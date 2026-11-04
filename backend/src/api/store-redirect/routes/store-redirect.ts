export default {
  routes: [
    {
      method: 'GET',
      path: '/store-redirects',
      handler: 'store-redirect.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/store-redirects/:id',
      handler: 'store-redirect.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};