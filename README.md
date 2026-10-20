# Pilum website

One-page static site for **Pilum**, a tactical RTS of frontier colonies and war. Built with [Astro](https://astro.build) and plain CSS, no UI framework.

Live: <https://pilumrts.com>

## Commands

Requires Node 22.12 or newer.

| Command | Action |
| :-- | :-- |
| `npm install` | Installs dependencies |
| `npm run dev` | Starts the dev server at `localhost:4321/` |
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

## Custom domain

The site is served at <https://pilumrts.com> (`public/CNAME`; `astro.config.mjs` has `site: 'https://pilumrts.com'`, `base: '/'`). DNS is on Cloudflare (pilumrts.com zone, account Pilum): four apex `A` records to GitHub Pages (185.199.108-111.153) and `www` CNAME to `pilumrts.github.io`, all **DNS only** (not proxied) so GitHub can issue the HTTPS certificate. The registrar is Porkbun.
