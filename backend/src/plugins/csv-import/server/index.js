'use strict';

const csvImportController = require('./controllers/csv-import');
const routes = require('./routes');

module.exports = {
  register(/* { strapi } */) {},
  bootstrap(/* { strapi } */) {},
  controllers: {
    'csv-import': csvImportController,
  },
  routes,
};
