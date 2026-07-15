export default {
  routes: [
    {
      method: 'POST',
      path: '/import/upload',
      handler: 'import-job.uploadAndImport',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/import/link-coupons',
      handler: 'import-job.linkCouponsToStores',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/import/jobs',
      handler: 'import-job.getJobs',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/import/jobs/:id',
      handler: 'import-job.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/import/jobs/:id/retry',
      handler: 'import-job.retryJob',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/import/cleanup',
      handler: 'import-job.cleanupExpired',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/import/stats',
      handler: 'import-job.getStats',
      config: {
        auth: false,
      },
    },
  ],
};