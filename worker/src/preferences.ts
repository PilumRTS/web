import type { D1Database } from '@cloudflare/workers-types';

type PreferenceEnv = { DB: D1Database; DOWNLOAD_ORIGIN: string };
type Purpose = 'preferences' | 'unsubscribe';
type PreferenceRecord = { id: string; email: string; updates_opt_in: number };
const seconds = () => Math.floor(Date.now() / 1000);

export function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function preferenceHash(purpose: Purpose, token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${purpose}:${token}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function preferencePage(title: string, content: string, status = 200, head = false): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pilum · ${title}</title></head>
<body><main><header><div class="identity"><img class="helmet" src="/assets/pilum-helmet-cream-v1.png" width="64" height="64" alt="Pilum helmet"><img class="wordmark" src="/assets/pilum-wordmark-din-v1.png" width="180" height="56" alt="PILUM"></div><p class="kicker">EMAIL UPDATES</p></header><section><h1>${title}</h1>${content}</section><footer><a href="https://pilumrts.com/">Back to Pilum</a><a href="https://pilumrts.com/privacy/">Privacy</a></footer></main>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:48px 16px;background:#0d0c0a;color:#d8ccb2;font:16px/1.65 Arial,sans-serif}main{max-width:560px;margin:auto;border:1px solid #493b27;background:#15130f}header{text-align:center;padding:28px 24px;border-bottom:1px solid #493b27}.helmet,.wordmark{display:block;margin:0 auto 18px;max-width:100%;height:auto}.identity{display:flex;align-items:center;justify-content:center;gap:16px}.identity .helmet{width:48px;margin:0}.identity .wordmark{width:160px;margin:0}.kicker{margin:18px 0 0;font-size:11px;letter-spacing:3px;color:#f0ad4a}section{padding:28px}h1{margin:0 0 20px;color:#ecdfc3;font:normal 30px/1.2 Impact,'Arial Narrow',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px}p{margin:0 0 20px}.muted{color:#9a8e76;font-size:14px}.notice{padding:14px;border-left:3px solid #e0962f;background:#211b12;color:#ecdfc3}label{display:flex;gap:12px;align-items:flex-start;margin:24px 0;cursor:pointer}input[type="hidden"]{display:none}input{width:20px;height:20px;flex:none;margin-top:3px;accent-color:#e0962f}button{display:block;appearance:none;border-radius:0;min-height:56px;width:100%;border:1px solid #f0ad4a;padding:16px;background:#e0962f;color:#17110a;font:bold 14px/1.4 Arial,sans-serif;text-align:center;letter-spacing:1px;text-transform:uppercase;cursor:pointer}button:focus-visible,a:focus-visible,input:focus-visible{outline:2px solid #f0ad4a;outline-offset:4px}a{color:#c3a067;cursor:pointer}footer{display:flex;justify-content:space-between;gap:20px;border-top:1px solid #493b27;padding:20px 28px;font-size:13px}</style></body></html>`;
  return new Response(head ? null : html, { status, headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  } });
}

async function readForm(request: Request): Promise<URLSearchParams> {
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded') || !request.body) throw new Error('form');
  const reader = request.body.getReader();
  let data = '';
  const decoder = new TextDecoder();
  let length = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    length += chunk.value.byteLength;
    if (length > 1024) { await reader.cancel(); throw new Error('form'); }
    data += decoder.decode(chunk.value, { stream: true });
  }
  data += decoder.decode();
  return new URLSearchParams(data);
}

/** GET/HEAD only render. Explicit same-origin POST is the only consent-changing path. */
export async function emailPreferences(request: Request, env: PreferenceEnv, purpose: Purpose): Promise<Response> {
  const url = new URL(request.url);
  const head = request.method === 'HEAD';
  if (!['GET', 'HEAD', 'POST'].includes(request.method)) return preferencePage('Use your email link', '<p>Open the preferences or unsubscribe link in your Pilum email.</p>', 405);
  const token = url.searchParams.get('token') ?? '';
  if (!/^[a-f0-9]{64}$/.test(token)) return preferencePage('Link incomplete', '<p>Use the full preferences or unsubscribe link in your Pilum email.</p>', 400, head);
  if (request.method === 'POST') {
    const origin = request.headers.get('Origin');
    // no-referrer can make native form POSTs report Origin: null. Fetch Metadata
    // still proves these came from our own page; cross-site/null requests fail closed.
    const sameOriginForm = request.headers.get('Sec-Fetch-Site') === 'same-origin';
    const trustedOrigin = origin === env.DOWNLOAD_ORIGIN || ((!origin || origin === 'null') && sameOriginForm);
    if (!trustedOrigin) return preferencePage('Request not accepted', '<p>Open your email link and use the button on that page.</p>', 403);
  }
  const tokenHash = await preferenceHash(purpose, token);
  const record = await env.DB.prepare(`SELECT s.id, s.email, s.updates_opt_in FROM email_preference_tokens t
    JOIN subscribers s ON s.id=t.subscriber_id WHERE t.token_hash=? AND t.purpose=?`)
    .bind(tokenHash, purpose).first<PreferenceRecord>();
  if (!record) return preferencePage('Link unavailable', '<p>This email link is no longer available. Contact <a href="mailto:info@pilumrts.com">info@pilumrts.com</a> for help with your preferences.</p>', 410, head);
  const [local, domain] = record.email.split('@');
  const address = escapeHtml(`${local.slice(0, 1)}•••@${domain}`);
  let notice = '';
  if (request.method === 'POST') {
    let form: URLSearchParams;
    try { form = await readForm(request); }
    catch { return preferencePage('Request not accepted', '<p>Please use the form in your email link.</p>', 400); }
    if (form.get('confirm') !== purpose) return preferencePage('Confirmation needed', '<p>Use the button in your email link to confirm your choice.</p>', 400);
    const updates = purpose === 'preferences' && form.get('updates') === 'on';
    const time = seconds();
    await env.DB.prepare(`UPDATE subscribers SET updates_opt_in=?, updates_unsubscribed_at=?,
      updates_changed_at=?, updates_consent_source=?, consent_version=?, updated_at=? WHERE id=?`)
      .bind(updates ? 1 : 0, updates ? null : time, time, purpose, 'preferences-v1-2026-10-22', time, record.id).run();
    record.updates_opt_in = updates ? 1 : 0;
    if (purpose === 'unsubscribe') return preferencePage("You're unsubscribed", `<p class="notice">You will no longer receive Pilum feature and update emails.</p><p>Your requested download emails are still available. Unsubscribing does not affect access to the alpha.</p><p class="muted">To change this later, use the separate preferences link in your Pilum email or explicitly opt in when requesting another download.</p>`);
    notice = `<p class="notice" role="status">Preferences saved. ${updates ? 'You’ll receive Pilum feature and update emails.' : 'You won’t receive Pilum feature and update emails.'}</p>`;
  }
  if (purpose === 'unsubscribe') return preferencePage('Unsubscribe from updates', `<p>Stop Pilum feature and update emails for <strong>${address}</strong>?</p><p class="muted">Opening this link has not changed your preferences. Requested download emails remain available.</p><form method="post" action="/unsubscribe?token=${token}"><input type="hidden" name="confirm" value="unsubscribe"><button type="submit">Unsubscribe from updates</button></form>` ,200,head);
  return preferencePage('Your email preferences', `${notice}<p>Choose which Pilum emails you want for <strong>${address}</strong>.</p><form method="post" action="/preferences?token=${token}"><input type="hidden" name="confirm" value="preferences"><label><input type="checkbox" name="updates"${record.updates_opt_in ? ' checked' : ''}><span>Email me when new features and updates are ready.</span></label><button type="submit">Save preferences</button></form><p class="muted" style="margin-top:24px">These settings apply to updates. Download emails you request will still be sent. You can change this choice at any time.</p>`,200,head);
}
