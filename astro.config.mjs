import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lumecon.ai',
  output: 'static',
  build: {
    format: 'file'
  }
});
