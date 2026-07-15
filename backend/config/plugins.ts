import path from 'path';
import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-local',
      providerOptions: {
        destination: path.join(__dirname, '..', 'public', 'uploads'),
      },
      responsiveImageFormat: [],
    },
  },
});

export default config;