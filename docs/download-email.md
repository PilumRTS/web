# Alpha downloads by email

Updated 22 October 2026. **Website publication approved; dedicated backend provisioned. Database and standard Email binding connected; complete email/notification bundle deployed as version `3782f7ef`; initial authorized test plus two separately approved final platform tests received.**

The user selected **Cloudflare Workers + native Cloudflare Email Sending** and personally upgraded Workers to Paid on 22 October. Dashboard verified Paid as the current plan. Amazon SES is no longer the active delivery path. Backend setup has resumed; website publication was explicitly approved on 22 October.

The popup, D1 storage, expiring links, current DIN wordmark and branded HTML/plain-text email are ready for review. Website hosting remains GitHub Pages. There is one existing private D1 database, created earlier within the Free allocation; all three real requests so far used the explicitly authorized test address.

## Visitor flow

1. Every Download button opens the required-email popup in Pilum's current sand/amber/dark style. The user-selected DIN Schablonierschrift font is self-hosted; Saira Condensed and IBM Plex Sans remain. Font license/provenance: `public/fonts/din-schablonierschrift/README.md`.
2. Mac or Windows must be selected; OS-specific CTAs preselect that platform, while generic CTAs use an editable platform selector. Email is required. “Email me when new features and updates are ready” is optional and unchecked. Download access does not require subscribing to updates.
3. The Worker saves the request in D1 and sends the branded download email through its native `EMAIL.send()` binding. This is Cloudflare **Email Sending**, not incoming Email Routing.
4. A successful provider acceptance produces the success response. Failure shows an error and invalidates that request's new token. Provider acceptance is not a delivery receipt; the site does not pretend a failed request was sent.
5. Each email contains exactly one selected-platform button/link, platform-specific subject and instructions, with no other OS content. A random 256-bit bearer token grants access for seven days; only a hash including the selected platform is stored. Changing a new token URL to the other OS cannot resolve its hash. The original two-platform test email remains compatible until expiry. Each link resolves the latest manifest for its OS on click (Mac 0.14.0 / Windows 0.13.0 when inspected). Public GitHub binaries remain public; this gates the website flow, not the release repository.
6. Records retain address, platform preference, dates, delivery state and optional update preference. Token use sets a verified timestamp; mail security scanners can also follow links. No bulk newsletter sender was added.

## Prepared files

- Popup: `src/components/DownloadDialog.astro`; all Download CTAs wired in `src/pages/index.astro`.
- Branded HTML/plain-text email: `worker/src/email.js`.
- Request, token and download API: `worker/src/index.ts`.
- Cloudflare binding/domain/account config: `worker/wrangler.jsonc`.
- D1 schema: `worker/migrations/0001_downloads.sql`.
- Visitor disclosure: `src/pages/privacy.astro`.

Sender/reply-to uses the existing website contact, `info@pilumrts.com`. Outbound sender-domain onboarding is complete. The SES transport and its draft policy were removed from the active bundle/dependencies; an unused reference copy remains outside the repo in `../work/website-email/ses-option/`. No MetricSpot code, SMTP settings or contacts were changed.

## Existing account access and external state

- Existing API token: `~/.config/pilum/cloudflare.token`. It verified active; DNS lookup and Worker-script listing succeeded. D1 and Email Sending API reads were denied. The token was not expanded; no secret values were printed or saved in this repo.
- Account **Pilum**: `ec5b7df56f3a7683902b3c7a879ae340`. Zone `pilumrts.com`: `1d77e9a59691c022beb19b21b6411d40`.
- Logged-in Firefox dashboard verified **Workers Paid: $5/month + usage**, current plan, after the user completed the purchase. The agent made no purchase or subscription change. Historical `pilum-cloudflare-current-plan.png` shows the earlier Free state, not the current plan.
- D1 **pilum-downloads**, ID **94499d97-d1ca-4cb9-b56e-46354c1f3b83**, was created earlier through the dashboard within Free allocation (0/10 databases before creation). The console reported successful execution of `0001_downloads.sql` plus standard `d1_migrations` tracking. No subscriber rows were inserted. Read-only inspection now confirms `subscribers`, `download_tokens`, `request_limits`, `d1_migrations`; migration `0001_downloads.sql`; initially zero subscribers before the authorized test.
- That database ID is retained in `worker/wrangler.jsonc`. Sender `pilumrts.com` is now Enabled / DNS Configured (sender ID `952a19aaa5014a508fdbbf09e2016927`). Initial quota is 200 emails/day; three individually authorized test emails were sent. Outbound DNS was added through sender onboarding; existing incoming routing and website records were preserved.
- Dedicated Worker `pilum-downloads` was created and the prepared code deployed through the dashboard after the existing API token failed on the Worker secrets API. Its three public runtime variables and encrypted `RATE_LIMIT_SALT` are saved. Hourly cleanup at minute 17 is configured. The user approved both connections at action time. D1 `DB` is connected and verified. The dashboard Email binding has no sender-restriction control. After explicit action-time approval for the standard binding (any verified sender in this account), `EMAIL` is now saved and verified. Local Wrangler configuration accurately declares the standard binding, without claiming a binding-level sender allowlist. The deployed application hardcodes sender and reply-to as `info@pilumrts.com`. Per-platform email generation and platform-bound token hashes were deployed as version `03d08d96` on 22 October. No schema migration was needed; subscriber platform still permits the historical `both` value, but the API only accepts `mac` or `windows` for new requests. `downloads.pilumrts.com` is connected with valid TLS; workers.dev and preview URLs are off. No new admin credentials were created.
- AWS was considered, but the user reported the account blocked and chose Cloudflare. The only local AWS API profile tested returned `InvalidClientTokenId`; existing MetricSpot SMTP credentials did not provide administration. No AWS identities, keys, policies or DNS records were created or reused for Pilum.

## Activation needs — only when explicitly resumed

1. **Complete:** the user upgraded Workers Paid and the dashboard confirms it. Current Cloudflare [Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/) lists 3,000 outbound emails/month included on Paid, then $0.35 per 1,000. Verified-destination-only sending on Free is insufficient for arbitrary visitors. The $5 Workers plan itself is separate from usage overages.
2. **Complete:** `pilumrts.com` onboarded under Compute → Email Service → Email Sending; outbound SPF/DKIM/bounce/DMARC records configured. Existing incoming mail and GitHub Pages records preserved. [Official setup](https://developers.cloudflare.com/email-service/get-started/send-emails/)
3. Use the logged-in authorized account or an appropriately scoped API session for D1/Worker/Email Sending. The current token lacks the required D1/Email access. Do not create or expand credentials without the required user handoff/approval. Do not paste secrets into source or chat.
4. **Complete:** D1 schema/migration verified, encrypted random `RATE_LIMIT_SALT` stored. **Complete:** user approved both connections and private D1 is connected. **Complete:** after separate explicit approval, standard `EMAIL` binding connected. Application sender is `info@pilumrts.com`; binding-level sender allowlisting is unavailable in this dashboard form. Fixed sender/reply-to constant now deployed and cannot be chosen by visitors.
5. **Complete:** prepared Worker deployed at `downloads.pilumrts.com` after sender verification. Keep the existing apex website on GitHub Pages; no proxy migration is required. Local email bindings must stay simulated (`remote` is not enabled) unless a real send is explicitly intended and authorized.
6. **Delivery confirmed by user:** user supplied `alex@revenuehunt.com` for exactly one test. Sent one `/request` POST with `platform=mac`, `updates=false`; HTTP 202 returned. The deployed code awaits provider acceptance and the D1 sent-status update before returning 202. No resend. User confirmed receipt, then requested per-platform delivery. That correction is now deployed; both selected-platform templates were rendered locally and visually reviewed, each with one button and no other-OS instructions. No unapproved resend occurred; the user later explicitly approved exactly two final platform tests, documented below. The separately approved final Mac/Windows emails were subsequently inspected in the existing alex@revenuehunt.com Gmail browser tab (no matching connector account was available). Both were received, displayed the correct DIN image, included only their selected OS button/instructions and linked YouTube/Discord. HEAD requests of their actual emailed URLs returned 302 to the correct current installer; changing the selected platform returned 410. No installers were downloaded. Read-only D1 read-back confirmed the exact test row: `selected_platform=mac`, `updates_opt_in=0`, created/sent `2026-10-22 08:15:57` UTC, `last_send_status=sent`. Proof saved as `pilum-test-signup-saved.png` in task outputs. Do not expose bearer URLs in logs/chat.
7. Publish the website only after backend verification and the standing commit/push/publication approval. Default API URL: `https://downloads.pilumrts.com/request`; optional build override `PUBLIC_DOWNLOAD_API_URL`.

Do not publish the frontend before the backend is active: it deliberately fails closed instead of exposing direct installer links or claiming success when mail cannot be sent.

## Data and abuse controls

Origin-restricted requests, bounded JSON, honeypot, atomic D1 limits (10 per IP/hour; 3 per email/15 minutes). IP/email limit keys are salted hashes; raw IP addresses are not persisted in this database. Cron clears expired tokens/counters. No public subscriber-list endpoint exists. Routine invocation logs are disabled because download URLs contain bearer tokens; error/exception visibility remains enabled. Do not log addresses or tokens. Cloudflare's email activity logs retain their own service settings.

Before future update campaigns, select only opted-in confirmed addresses and honor deletion/unsubscribe requests. No newsletter delivery is implemented. Deleting a subscriber cascades its tokens. Privacy copy names Cloudflare as processor/storage/delivery provider.

## Approved Windows note

On first opening the installer, SmartScreen may show “Windows protected your PC”. Click **More info** → **Run anyway**.

This wording is in both the website and matching HTML/plain-text email. The proposed sentence about new versions was dropped.

## Validation and limits

Scoped existing checks: Astro build/check, Worker TypeScript and Wrangler dry-run bundle. Per-OS manifest reads succeeded (Mac 0.14.0 / Windows 0.13.0); both installer HEAD requests returned 200 without downloading binaries. Popup and branded email were visually reviewed. No broad test suites, commits, pushes, merges, releases or website publication. Three real requests were explicitly authorized for the same supplied test address (initial test, then one final Mac and one final Windows test), all with marketing opt-in false; no other real requests sent. No-mail checks on the deployed service: permitted-origin OPTIONS → 204 with exact CORS; invalid-email POST → 400 (therefore configured DB/EMAIL/salt presence checks passed); foreign-origin POST → 403; missing-token download → 400. These paths do not create subscriber rows or send mail. After the platform correction, a no-mail `both` request returned HTTP 400 “Choose Mac or Windows.”, confirming the new version is active. Python urllib was rejected with generic HTTP 403 before app responses while curl returned the expected results; the one authorized recipient subsequently confirmed receipt. The user personally upgraded the account; backend provisioning details are recorded above.

## Primary API references

- [Cloudflare Email Sending Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [Sender restrictions](https://developers.cloudflare.com/email-service/configuration/send-bindings/)
- [Local simulated vs remote delivery](https://developers.cloudflare.com/email-service/observability/local-development/sending/)

## Private Discord signup summaries (deployed and delivery verified)

The user requested a summary for each new signup in private Discord `#admin`. The webhook is stored outside the repository; the Worker will receive it only through encrypted secret `DISCORD_SIGNUP_WEBHOOK_URL`. The user approved that posting connection at action time, and the dashboard confirms the secret is encrypted. No webhook value belongs in source, chat, screenshots or logs.

Prepared migration `0002_signup_notifications.sql` creates a transactional outbox and an `AFTER INSERT` trigger on `subscribers`. This queues one snapshot per genuinely new unique signup in the same database transaction. Repeat downloads update the existing subscriber and do not create another signup alert. Snapshot fields are limited to email, chosen platform, optional update consent and original signup timestamp. No IP address, download bearer token, inferred name, enrichment or profile lookup is included. Discord mentions are disabled in the payload.

`worker/src/notifications.ts` drains small batches in background request work and the hourly cron. A D1 lease prevents concurrent handlers sending the same event, successful webhook delivery stores the returned Discord message ID, and failed requests retain the event for bounded-backoff retries. Notification failures do not change download-email success. As with any remote webhook, a response lost after Discord accepted it can lead to a duplicate retry; the stable signup event ID in the footer makes those recognizable. This is not an exactly-once delivery claim. Deleting a subscriber cascades its queued event; already-posted Discord messages need separate handling for deletion requests.

Migration `0002_signup_notifications.sql` and its insert trigger are applied and verified. One existing authorized test signup was queued with `source=backfill-test`. The encrypted production webhook secret is saved. Complete version `3782f7ef` is deployed at 100% and marked Ready; screenshot `pilum-final-email-backend-deployed.png` records this. The editor's Schedule preview did not consume the queued event because the webhook is production-only. Production cron delivered the single labeled backfill at `2026-10-22 09:17:56` UTC. D1 read-back records `attempts=1`, `delivered_at` set and Discord message ID `1562756884921065578`. Receipt proof is `pilum-signup-discord-delivered.png` in task outputs. Successful records are excluded from future retries. No notification-path email was sent. Worker TypeScript and dry-run bundle pass. Website privacy copy discloses the private Discord summary; website publication was explicitly approved on 22 October.

## Email wordmark correction (deployed)

The received-email screenshot showed Gmail falling back to a different display font; the yellow rectangle was Gmail highlighting its search term “pilum”. The header now uses an email-safe transparent PNG rendered from the approved original DIN Schablonierschrift font, in the existing cream brand colour. The same author/license provenance applies. The PNG source is `public/brand/pilum-wordmark-din-v1.png`; the deployed Worker serves it at `/assets/pilum-wordmark-din-v1.png` on `downloads.pilumrts.com`, so it does not depend on a website push or Gmail webfont support. Email clients that block external images show the alt text PILUM until images are enabled.

Both per-platform email variants now explicitly link YouTube (`https://www.youtube.com/@PilumRTS`) and the verified existing site Discord invite (`https://discord.gg/pv4KJVRcn3`) in HTML and plain text. Portable HTML/plain-text previews in task outputs are refreshed. Full corrected Mac/Windows PNG previews (`pilum-mac-download-email-full-preview.png`, `pilum-windows-download-email-full-preview.png`) were rendered with isolated WeasyPrint/Poppler and visually inspected: centered correct DIN image, one OS CTA/instructions, both social links and full footer. Review copies use local/data images; production HTML retains HTTPS URLs. These are static renderer previews, not Gmail screenshots. The complete backend bundle is deployed as `3782f7ef`; the live PNG was fetched and matched the reviewed source byte for byte (7,528 bytes). The user subsequently approved two final inbox tests; both were received and visually checked. Website publication was explicitly approved on 22 October.

## Final platform inbox checks (explicitly approved)

The user separately approved “Send both test emails” to `alex@revenuehunt.com`. Exactly one Mac and one Windows request were sent, both `updates=false`, returning HTTP 202. Both arrived in the existing recipient Gmail inbox at 12:27–12:28 Zurich time on 22 October. Screenshots `pilum-mac-email-received.png` and `pilum-windows-email-received.png` show the correct DIN image; message content confirms one selected OS CTA/instructions and both social links.

Read-only D1 inspection after these requests confirmed one unique subscriber, `platform=windows` (most recent selection), `updates_opt_in=0`, `last_send_status=sent`, provider message ID saved, three total download-token records (original + two final tests), and one unchanged signup-notification row. The parent independently confirmed the same single Discord message; repeat downloads did not create another signup notification. The latest send timestamp is `2026-10-22 10:27:58` UTC.

Actual final emailed URLs were checked privately with HEAD requests: Mac → HTTP 302 to `v0.14.0/Pilum-Alpha-0.14.0-mac.dmg`; Windows → HTTP 302 to `v0.13.0/Pilum-Alpha-0.13.0-windows-setup.exe`. Changing either link to the other platform returned HTTP 410, confirming platform binding. Token URLs were not printed or committed. No installer was downloaded, no further email was sent, and the website publication was subsequently approved on 22 October.

## Transparent email helmet (deployed)

The user requested removal of the grey app-icon tile after the final inbox checks. The existing site's `public/helmet-mask.png` supplies the original helmet geometry and alpha; `public/brand/pilum-helmet-cream-v1.png` applies the existing email cream colour `#ecdfc3` to that exact alpha without redrawing the mark. The new PNG is RGBA, 584×586, alpha range 0–255, 41,925 bytes. It is served by the Worker at `/assets/pilum-helmet-cream-v1.png`; email replaces the app icon URL with this transparent asset. Both full Mac/Windows previews were refreshed and visually inspected: no grey square, correct DIN wordmark, one platform and both social links.

Worker TypeScript and dry-run bundle pass (84.20 KiB / 55.93 KiB gzip). After the earlier browser interruptions, complete version `6985cbe8` deployed successfully and was verified Active / Latest. The live helmet asset returns HTTP 200, matches the reviewed source byte for byte and decodes as RGBA with alpha 0–255 and transparent corner. The deployed template visibly references the transparent asset. Deployment proof: `pilum-transparent-helmet-deployed.png` in task outputs. No additional email was sent after this visual update; the final inbox tests above predate the transparent helmet change.

## Website publication approval

The user approved committing and pushing the website update on 22 October, including Mac/Windows required-email popup, unchecked optional updates preference, privacy notice and the previously requested DIN display font. They also approved the final squad copy (Support heavy machine guns; Engineers three men; Recon cloaks that turn) and “Enemies loot too.” The email backend remains independently deployed; transparent helmet asset deployment status is recorded above. Live popup verification must not submit a form or send an email.

## Website published and live verification

Website feature commit `c4265d1` and vehicle-copy follow-up `7307937` were pushed to `main` with explicit user approval; both GitHub Pages build/deploy workflows succeeded. Live HTTP inspection confirms both OS buttons, required email, unchecked optional updates checkbox, privacy page HTTP 200, updated squads/loot and “Killing hits knock vehicles out.”

Live Firefox interaction verified that Download for Mac opens the popup preselected to Mac, email empty/focused and optional updates unchecked. Screenshot `pilum-live-mac-download-popup.png` was visually inspected. The Windows interaction was interrupted by active user input; the final UI again showed Mac, so Windows interaction is not claimed as verified. Its live button and shared handler's Windows preselection are confirmed in shipped source. No form was submitted and no additional email was sent.

## Cursor consistency

The user reported stray grey outlined arrow shapes. The supplied crops were inspected alongside the original hero backdrop and all site markup/CSS/assets; no matching graphic or custom cursor is defined by the site. The same glyph appears in earlier Gmail/Cloudflare computer-control screenshots, supporting an external pointer-overlay explanation, though its exact owner was not established. The website now explicitly uses pointer cursors for enabled semantic links, buttons, selects, checkboxes/radios and disclosures; disabled controls use not-allowed, while email entry keeps its text cursor.

## Popup wording and field order refinement

The user requested the introduction “Get the download link directly in your inbox.”, Email address before Platform, optional checkbox “Email me when new features and updates are ready.” and footer “Unsubscribe from updates at any time.” with Privacy retained. The checkbox remains unchecked; sending a download does not require marketing consent. Generic download buttons detect the visitor's OS, while Mac/Windows buttons preserve their explicit platform intent. No live email submission is needed for these presentation checks.

## Compact hero/header

The user requested removal of the large hero helmet and hero Early alpha badge. The large PILUM wordmark, tagline and CTAs remain. The outlined square-corner Early alpha badge is now beside the header helmet/PILUM wordmark; the header wraps on narrow screens and keeps the wordmark visible. Hero minimum height was reduced to make the removed artwork save vertical space rather than leaving an empty tall section.

## Visitor platform order

Supported Mac/Windows platform detection is centralized in `src/lib/download-platform.js`, preferring User-Agent Client Hints platform and falling back to navigator platform/user-agent. A recognized OS moves its actual download card first in the DOM, so left/first-stacked and keyboard order agree; both cards remain. Unknown devices keep server order. The same detection preselects generic hero/header Download forms, while named Mac/Windows buttons always select their explicit OS. Optional updates remain unchecked and independent of download access.

## Market clarification

The user explicitly identified the United States as Pilum's first market on 22 October. Do not infer company domicile, applicable law or market from the workstation timezone. The updates checkbox remains unchecked in the shipped popup; no instruction to change its default was given with this clarification.
