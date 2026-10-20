// @ts-check
import { defineConfig } from 'astro/config';

// Served at https://pilumrts.com (GitHub Pages custom domain, public/CNAME).
export default defineConfig({
  site: 'https://pilumrts.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
});
