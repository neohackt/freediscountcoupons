'use strict';

// Served under the admin API as POST /csv-import/upload.
// Requires a valid Strapi admin session (no machine token).
module.exports = {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'POST',
        path: '/upload',
        handler: 'csv-import.upload',
        config: {
          policies: ['admin::isAuthenticatedAdmin'],
        },
      },
    ],
  },
};
