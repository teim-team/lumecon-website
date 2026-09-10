import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

export default defineConfig({
  site: 'https://lumecon.ai',
  output: 'static',
  // The smoke harness serves the unmodified production build over HTTPS.
  // Safari honors upgrade-insecure-requests on localhost as well as live hosts.
  vite: {
    preview: {
      ...(process.env.SMOKE_TLS_KEY && process.env.SMOKE_TLS_CERT
        ? {
            https: {
              key: readFileSync(process.env.SMOKE_TLS_KEY),
              cert: readFileSync(process.env.SMOKE_TLS_CERT),
            },
          }
        : {}),
    },
  },
  build: {
    format: 'directory',
  },
  trailingSlash: 'never',
  // /join is retired for now; keep the old URL landing somewhere sensible.
  // (/about is gone too, so the redirect lands on the homepage.)
  redirects: {
    '/join': '/',
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !['/checkout', '/welcome', '/choose-plan', '/login', '/signup'].some((path) =>
          page.includes(path),
        ),
    }),
  ],
});
