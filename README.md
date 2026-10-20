# Pilum website

One-page static site for **Pilum**, a tactical RTS of frontier colonies and war. Built with [Astro](https://astro.build) and plain CSS, no UI framework.

Live (for now): <https://pilumrts.github.io/web/>

## Commands

Requires Node 22.12 or newer.

| Command | Action |
| :-- | :-- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts the dev server at `localhost:4321/web/` |
| `npm run build` | Type-checks and builds to `./dist/` |
| `npm run preview` | Serves the built site locally |

## Layout

- `src/pages/index.astro`: the whole page (hero, about, download, follow, footer).
- `src/layouts/Layout.astro`: `<head>`, meta tags, favicons, Google Fonts.
- `src/styles/global.css`: colours, type and layout.
- `public/`: favicons and `helmet-mask.png` (the helmet icon as an alpha mask, tinted in CSS).

Download links point to <https://github.com/PilumRTS/pilum-releases/releases/latest>.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: `withastro/action` builds the site and `actions/deploy-pages` publishes it. The repo's Pages source is set to **GitHub Actions**.

## Custom domain plan (not done yet)

The site is served at `https://pilumrts.github.io/web/`, so `astro.config.mjs` sets `site: 'https://pilumrts.github.io'` and `base: '/web'`. To move it to pilumrts.com:

1. Point the pilumrts.com DNS at GitHub Pages (apex A/AAAA records, or `www` CNAME to `pilumrts.github.io`).
2. Add the file `public/CNAME` containing the single line `pilumrts.com`.
3. In `astro.config.mjs`, set `site: 'https://pilumrts.com'` and `base: '/'`.
4. Set the custom domain in the repo's Pages settings and enable HTTPS.
