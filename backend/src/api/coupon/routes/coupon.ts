export default {
  routes: [
    {
      method: 'GET',
      path: '/coupons/featured',
      handler: 'coupon.findFeatured',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/coupons/trending',
      handler: 'coupon.findTrending',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/coupons',
      handler: 'coupon.find',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/coupons/:id',
      handler: 'coupon.findOne',
      config: { auth: false },
    },
  ],
};