'use strict';

/**
 * Admin-session entry point to the existing importer.
 *
 * This controller contains no import logic of its own: it delegates to the
 * existing `api::import-job.import-job` controller action, so the admin UI
 * and the machine API execute the exact same code path and return the exact
 * same response shape. Authentication is enforced by the route (admin
 * session via `admin::isAuthenticatedAdmin`); the machine token is never
 * accepted or required here.
 */
module.exports = ({ strapi }) => ({
  async upload(ctx) {
    const controller = strapi.controller('api::import-job.import-job');
    return controller.uploadAndImport(ctx);
  },
});
