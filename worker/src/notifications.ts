import type { D1Database } from '@cloudflare/workers-types';

type NotificationEnv = { DB: D1Database; DISCORD_SIGNUP_WEBHOOK_URL?: string };
type SignupEvent = {
  subscriber_id: string; email: string; platform: string; updates_opt_in: number;
  created_at: number; source: string; attempts: number;
};
const seconds = () => Math.floor(Date.now() / 1000);

/** Isolated from download email success. Unsent events survive for cron retries. */
export async function notifySignups(env: NotificationEnv): Promise<void> {
  if (!env.DISCORD_SIGNUP_WEBHOOK_URL) return;
  try {
    const webhook = new URL(env.DISCORD_SIGNUP_WEBHOOK_URL);
    if (webhook.protocol !== 'https:' || webhook.hostname !== 'discord.com' || !/^\/api\/webhooks\/\d+\/[\w-]+$/.test(webhook.pathname)) return;
    webhook.searchParams.set('wait', 'true');
    // Small batches limit work; a claim lease prevents concurrent cron/request duplicates.
    for (let i = 0; i < 3; i++) {
      const time = seconds();
      const claim = crypto.randomUUID();
      const event = await env.DB.prepare(`UPDATE signup_notifications
        SET lease_until=?, claim_id=?, attempts=attempts+1
        WHERE subscriber_id=(SELECT subscriber_id FROM signup_notifications
          WHERE delivered_at IS NULL AND next_attempt_at<=? AND lease_until<=?
          ORDER BY created_at LIMIT 1)
        RETURNING subscriber_id, email, platform, updates_opt_in, created_at, source, attempts`)
        .bind(time + 120, claim, time, time).first<SignupEvent>();
      if (!event) return;
      try {
        const response = await fetch(webhook, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            allowed_mentions: { parse: [] },
            embeds: [{
              title: event.source === 'backfill-test' ? 'Test signup (backfill)' : 'New Pilum signup',
              color: 0xe0962f,
              fields: [
                { name: 'Email', value: event.email },
                { name: 'Platform', value: event.platform === 'mac' ? 'Mac' : event.platform === 'windows' ? 'Windows' : event.platform, inline: true },
                { name: 'Optional updates', value: event.updates_opt_in ? 'Opted in' : 'Not opted in', inline: true },
                { name: 'Signed up (UTC)', value: new Date(event.created_at * 1000).toISOString() },
              ],
              footer: { text: `Signup event ${event.subscriber_id}` },
            }],
          }),
        });
        if (!response.ok) throw new Error('notification-send');
        const message = await response.json() as { id?: unknown };
        if (typeof message.id !== 'string' || !/^\d+$/.test(message.id)) throw new Error('notification-response');
        await env.DB.prepare(`UPDATE signup_notifications SET delivered_at=?, discord_message_id=?, lease_until=0, claim_id=NULL
          WHERE subscriber_id=? AND claim_id=?`)
          .bind(seconds(), message.id, event.subscriber_id, claim).run();
      } catch {
        // Retry with bounded exponential backoff; never log webhook, address or payload.
        const delay = Math.min(3600, 60 * 2 ** Math.min(event.attempts - 1, 6));
        await env.DB.prepare(`UPDATE signup_notifications SET next_attempt_at=?, lease_until=0, claim_id=NULL
          WHERE subscriber_id=? AND claim_id=? AND delivered_at IS NULL`)
          .bind(seconds() + delay, event.subscriber_id, claim).run();
        console.error('signup-notification-retry');
      }
    }
  } catch {
    console.error('signup-notification-unavailable');
  }
}
