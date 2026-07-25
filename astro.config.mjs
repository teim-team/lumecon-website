import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lumecon.ai',
  output: 'static',
  build: {
    format: 'directory'
  },
  trailingSlash: 'never',
  // /join is retired for now; keep the old URL landing somewhere sensible.
  // (/about is gone too, so the redirect lands on the homepage.)
  redirects: {
    '/join': '/'
  },
  integrations: [
    sitemap({
      // /film is unlisted: reachable by direct link only, kept out of the
      // sitemap (and noindex'd in its layout props).
      filter: (page) => !page.includes('/film')
    })
  ]
});
