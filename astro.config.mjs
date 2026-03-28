import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lumecon.ai',
  output: 'static',
  build: {
    format: 'directory'
  },
  trailingSlash: 'never',
  integrations: [sitemap()]
});
