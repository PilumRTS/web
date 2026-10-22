# Email and download operations

This repo contains the website and the `pilum-downloads` Worker. The website deploys through GitHub Pages. `.github/workflows/deploy-worker.yml` deploys the Worker when backend files change on `main`, or when manually dispatched on `main`. Both use the committed lockfile. Video capture and the Unity repository are outside this workflow.

## Resources and configuration

`worker/wrangler.jsonc` is the source of truth for public variables, domains, cron, D1 and email bindings. Keep it synchronized before changing account settings. The Worker serves:

- `mail.pilumrts.com`: new preferences/unsubscribe links and email images.
- `download.pilumrts.com`: new installer links.
- `downloads.pilumrts.com`: compatibility for existing emails and the website's current API endpoint.

The private D1 database is `pilum-downloads`, binding `DB`, ID `94499d97-d1ca-4cb9-b56e-46354c1f3b83`. Its schema is versioned in `worker/migrations/`; subscriber data and consent are not Git contents. Installers remain GitHub Release assets in `PilumRTS/releases`.

Worker secrets are `RATE_LIMIT_SALT` and `DISCORD_SIGNUP_WEBHOOK_URL`. The native `EMAIL` binding sends from `info@pilumrts.com`. Source/config changes do not contain or rotate those secrets. Wrangler preserves existing secret bindings during deployment; a new account needs its own secret values and verified sender setup. See [Cloudflare's configuration rules](https://developers.cloudflare.com/workers/wrangler/configuration/).

## Deployment access

The GitHub environment `worker-production` is configured to allow only `main`. Its `CLOUDFLARE_API_TOKEN` secret is connected and the first authenticated deployment succeeded. The account ID is a public identifier in the workflow/config. Use a token limited to the existing Worker, the existing D1 database and the Pilum zone wherever Cloudflare supports resource-specific scopes:

- Individual Worker Editor: deploy `pilum-downloads`.
- Workers Metadata Read-Only at the Pilum account scope: required for Wrangler’s account-level route/domain discovery. The initial single-Worker Editor token could read the Worker and D1 but received HTTP 403 on those discovery endpoints; adding this read-only role resolved both. Write access remains scoped to the existing Worker.
- D1 Write: apply migrations and obtain recovery bookmarks. The current Cloudflare form scopes this permission to the Pilum account, not an individual database; the review explicitly shows that account-level scope.
- Zone Workers Routes Write and Zone Read: reconcile the three custom domains in the Pilum zone.

Do not grant billing, unrelated accounts, KV or R2 administration. Keep token values outside Git and command output. The earlier local token lacks Worker upload and D1 access and cannot power this workflow. [Worker authorization](https://developers.cloudflare.com/workers/authorization/workers/) documents the deployment/domain permissions; [GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) documents CI authentication.

The workflow checks and bundles before accessing production, records a D1 recovery bookmark, applies unapplied migrations, then deploys the committed Worker and configuration. The deployment message records the commit SHA. Concurrent deployments are serialized. Migrations must be additive and compatible with the currently running code; database schema changes and code rollbacks are separate operations. CI's public-route checks send no email and change no subscriber preferences.

## Backups and exports

D1 Time Travel is automatic for production databases. Workers Paid retains 30 days of recovery history. A bookmark identifies a recovery point; it is not an exported copy. See [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/). The workflow records the current bookmark before migrations. No scheduled off-provider export is configured by this workflow.

For a private SQL export, run from this repo with the scoped Cloudflare credentials already loaded into the process environment:

```sh
umask 077
backup_dir="$(pwd)/../work/private-backups"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
backup_file="$backup_dir/pilum-downloads-$(date -u +%Y%m%dT%H%M%SZ).sql"
npx --no-install wrangler d1 export pilum-downloads --remote --config worker/wrangler.jsonc --output "$backup_file"
```

The export contains email addresses, consent history and hashed tokens. Keep it in encrypted private storage; never commit it, attach it to a public issue or upload it as a public-repo Actions artifact. A running export can briefly block database requests. [D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/) documents the SQL format and commands.

## Recovery

For a code-only incident, redeploy a known-good committed Worker with its matching configuration, or use Cloudflare's previous version. Do not rerun historical migrations to roll code back. Verify public pages, then request approval for any new test email if one is needed.

For data recovery, first record the current bookmark and export current state. Select the incident timestamp in UTC and obtain its bookmark:

```sh
npx --no-install wrangler d1 time-travel info pilum-downloads --config worker/wrangler.jsonc
npx --no-install wrangler d1 time-travel info pilum-downloads --config worker/wrangler.jsonc --timestamp 'REPLACE_WITH_INCIDENT_UTC_TIMESTAMP'
```

A production Time Travel restore overwrites the database and cancels in-flight queries. It requires the owner's explicit approval for that recovery action; acceptance of this runbook is not approval to restore production. Coordinate a pause in signups and notification delivery first. After approval, restore the chosen bookmark:

```sh
npx --no-install wrangler d1 time-travel restore pilum-downloads --config worker/wrangler.jsonc --bookmark 'REPLACE_WITH_APPROVED_BOOKMARK'
```

Before resuming traffic, compare post-bookmark consent changes and deletions against the pre-restore export. Reapply later opt-outs/deletions before any outreach so recovery cannot silently re-subscribe people. Reconcile notification delivery markers: Discord messages already sent are not undone by a database restore, and restoring pending outbox entries can replay them. Code must match the restored migration state.

For an export recovery drill, an operator with resource-creation access can create a separate disposable D1 database and import the SQL with `wrangler d1 execute RECOVERY_DATABASE --remote --file PRIVATE_BACKUP.sql`. Use no production Worker bindings or cron, and verify subscribers/consent, token relationships, migration records and outbox state there. Never import a full dump directly over production. Delete the disposable database when finished. No destructive restore or recovery drill is implied by deployment verification.

## Verification record

On 22 October 2026, [workflow run 39789139611, attempt 2](https://github.com/PilumRTS/web/actions/runs/39789139611) completed successfully for commit `0fca3af`. It checked/bundled the source, read a live D1 recovery bookmark, confirmed there were no unapplied migrations, deployed version `07d70f56-9ee5-4fd9-8cb1-e9dcbf0872b4`, and passed all four public-route checks plus both logo-image requests. It sent no email and changed no subscriber preferences. The first attempt failed during read-only dashboard metadata discovery before uploading; the approved account-level metadata-read role fixed that failure without expanding Worker write access. The existing GitHub Actions secret did not need replacement.

Production restore has not been exercised. No scheduled off-provider export is configured, and this document does not claim a tested full disaster recovery.
