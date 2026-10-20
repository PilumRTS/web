// @ts-check
import { defineConfig } from 'astro/config';

// Served at https://pilumrts.github.io/web/ until pilumrts.com is switched over.
// When the custom domain goes live: site 'https://pilumrts.com', base '/'.
export default defineConfig({
  site: 'https://pilumrts.github.io',
  base: '/web',
  output: 'static',
  trailingSlash: 'always',
});
