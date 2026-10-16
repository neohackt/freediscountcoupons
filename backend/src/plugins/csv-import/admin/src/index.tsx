import { PuzzlePiece } from '@strapi/icons';

import pluginId from './pluginId';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PuzzlePiece,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'CSV Import',
      },
      Component: async () => {
        const { CsvImportPage } = await import('./pages/CsvImportPage');
        return CsvImportPage;
      },
    });

    app.registerPlugin({
      id: pluginId,
      name: pluginId,
    });
  },

  bootstrap() {},
};
