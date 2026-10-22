# Pilum website

One-page static site for **Pilum**, a grimdark tactical RTS of frontier colonies and war. Built with [Astro](https://astro.build) and plain CSS, no UI framework.

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
- `public/`: favicons, `helmet-mask.png` (the helmet alpha mask, tinted in CSS), and `hero-night.webp` (about 157 KiB, night-scene hero backdrop without baked-in text or branding).

Download buttons now open a required-email popup. A separate Cloudflare Worker stores requests in D1 and sends the branded download email through native Cloudflare Email Service. The user upgraded Workers Paid ($5/month plus usage), and sender DNS, D1, native email binding and backend are provisioned. Emails contain only the selected Mac or Windows platform; token hashes bind access to that platform. Emailed links resolve the latest `release-manifest-<os>.json` per OS at click time. **Website published on 22 October; initial test and both separately approved final platform emails received; actual download redirects and cross-platform rejection verified. Per-platform email, image wordmark/social links, and private Discord signup summaries are deployed. One labeled existing-signup notification was delivered and its receipt stored in D1. Emails now include separate scanner-safe unsubscribe/preferences links; confirmed opt-out persists until explicit re-opt-in.** Account access and launch steps: [docs/download-email.md](docs/download-email.md).

## Presentation shipped 21 October 2026

- Hero: the day/night headline followed by "A grimdark tactical RTS of frontier colonies and war." The logo, copy and CTAs stay in HTML/CSS over `hero-night.webp`; cover crop, lighter dark overlays, a bottom fade and black foreground shadows keep the scene secondary. Dark secondary-button backgrounds preserve legibility.
- The frontier: commander sent to the rim, followed by the colony paying for wages, food and supplies and balancing civilian growth against sustaining the army. Approved terms: "settlement growing" and "part of the colony". The page description uses the same setting and commander role.
- Deployed on main through `ee4aecf`: `8715145` (backdrop), `c02d78b` (setting/commander), `e9cb6f7` (army economy), `ee4aecf` (settlement/colony wording). Pages deployments passed; final text checked on https://pilumrts.com.
- The matching YouTube description starts with the grimdark genre line, without the website's day/night opening. Website and Discord links and info@pilumrts.com are set; the banner retains the day/night headline.
- Full approved copy and decisions: `../app/docs/marketing-prd.md` §2.10. This presentation does not implement colony gameplay or close the game's licence checklist.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: `withastro/action` builds the site and `actions/deploy-pages` publishes it. The repo's Pages source is set to **GitHub Actions**.

## Custom domain

The site is served at <https://pilumrts.com> (`public/CNAME`; `astro.config.mjs` has `site: 'https://pilumrts.com'`, `base: '/'`). DNS is on Cloudflare (pilumrts.com zone, account Pilum): four apex `A` records to GitHub Pages (185.199.108-111.153) and `www` CNAME to `pilumrts.github.io`, all **DNS only** (not proxied) so GitHub can issue the HTTPS certificate. The registrar is Porkbun.

## Display font (22 October 2026)

The user selected DIN Schablonierschrift by Marian Steinbach for the PILUM wordmark and existing display labels. It replaces Saira Stencil One; Saira Condensed and IBM Plex Sans remain unchanged. The author's original Version 2 WOFF is self-hosted at `public/fonts/din-schablonierschrift/`, with license/provenance and the original specimen. The author licenses it under CC ShareAlike 1.0 and explicitly allows commercial publications. No glyph edits or conversion. Email uses an image of the approved DIN wordmark so clients do not substitute a different font. The email backend is deployed. The website update was published on 22 October through commits `c4265d1` and `7307937`; both Pages deployments passed. The transparent email helmet and persistent unsubscribe/preferences pages are active in Worker `db53446b`.

New download emails come from **Alex from Pilum**, use `download.pilumrts.com` for the selected installer and `mail.pilumrts.com` for preferences/unsubscribe and email brand images. Legacy `downloads.pilumrts.com` links remain valid. Both new domains, native mail-host preference forms, and one final delivered Mac test were verified on 22 October.
