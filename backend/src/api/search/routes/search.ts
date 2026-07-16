export default {
  routes: [
    {
      method: 'GET',
      path: '/search',
      handler: 'search.index',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/search/autocomplete',
      handler: 'search.autocomplete',
      config: { auth: false },
    },
  ],
};
