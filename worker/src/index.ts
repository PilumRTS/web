import type { D1Database, ExecutionContext } from '@cloudflare/workers-types';
import { downloadEmail } from './email.js';
import { notifySignups } from './notifications';
import { wordmarkPng, helmetPng } from './wordmark.js';

interface Env {
  DB: D1Database;
  EMAIL: { send(message: { from: { email: string; name: string }; to: string; subject: string; html: string; text: string; replyTo: string }): Promise<{ messageId: string }> };
  SITE_ORIGIN: string;
  DOWNLOAD_ORIGIN: string;
  EMAIL_FROM: string;
  RATE_LIMIT_SALT: string;
  DISCORD_SIGNUP_WEBHOOK_URL?: string;
}

// The standard Cloudflare binding permits verified account senders; this app has one fixed sender.
const senderAddress = 'info@pilumrts.com';
const consentVersion = 'download-v1-2026-10-22';
const week = 7 * 24 * 60 * 60;
const accepted = { message: 'Your download email is on its way. Check your inbox and spam folder.' };
const encoder = new TextEncoder();
const now = () => Math.floor(Date.now() / 1000);

async function hash(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function headers(origin?: string) {
  const value = new Headers({
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
  });
  if (origin) value.set('Access-Control-Allow-Origin', origin);
  return value;
}

function json(body: object, status: number, origin?: string, extra?: Record<string, string>) {
  const h = headers(origin);
  h.set('Content-Type', 'application/json; charset=utf-8');
  for (const [key, value] of Object.entries(extra ?? {})) h.set(key, value);
  return new Response(JSON.stringify(body), { status, headers: h });
}

// Atomic D1 increment prevents concurrent requests bypassing the per-key cap.
async function limit(env: Env, key: string, max: number, seconds: number) {
  const time = now();
  const row = await env.DB.prepare(`INSERT INTO request_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN expires_at <= ? THEN 1 ELSE count + 1 END,
      expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END
    WHERE expires_at <= ? OR count < ? RETURNING count`)
    .bind(key, time + seconds, time, time, time, max).first<{ count: number }>();
  return Boolean(row);
}

async function readSmallJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.body || !request.headers.get('Content-Type')?.startsWith('application/json')) throw new Error('body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    size += item.value.byteLength;
    if (size > 4096) { await reader.cancel(); throw new Error('body'); }
    chunks.push(item.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('body');
  return value as Record<string, unknown>;
}

async function requestDownloads(request: Request, env: Env, ctx: ExecutionContext) {
  const origin = request.headers.get('Origin');
  if (origin !== env.SITE_ORIGIN) return json({ message: 'Please request downloads from pilumrts.com.' }, 403);
  if (!env.RATE_LIMIT_SALT || !env.DB || !env.EMAIL) return json({ message: 'Downloads by email are temporarily unavailable. Please try again shortly.' }, 503, origin);

  let input: Record<string, unknown>;
  try { input = await readSmallJson(request); }
  catch { return json({ message: 'Please enter a valid email address.' }, 400, origin); }
  // Quiet honeypot response; never send to addresses supplied by these submissions.
  if (input.website) return json(accepted, 202, origin);
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (input.platform !== 'mac' && input.platform !== 'windows') return json({ message: 'Choose Mac or Windows.' }, 400, origin);
  const platform = input.platform;
  const updates = input.updates === true;
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)) {
    return json({ message: 'Please enter a valid email address.' }, 400, origin);
  }
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return json({ message: 'Please try again shortly.' }, 503, origin);
  const ipKey = await hash(`${env.RATE_LIMIT_SALT}:ip:${ip}`);
  const emailKey = await hash(`${env.RATE_LIMIT_SALT}:email:${email}`);
  if (!await limit(env, ipKey, 10, 3600) || !await limit(env, emailKey, 3, 900)) {
    return json({ message: 'Please wait a little before requesting another download email.' }, 429, origin, { 'Retry-After': '900' });
  }

  const time = now();
  // Existing opt-in is retained; a download request cannot silently unsubscribe it.
  const subscriber = await env.DB.prepare(`INSERT INTO subscribers
    (id, email, platform, updates_opt_in, consent_version, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET platform=excluded.platform,
      updates_opt_in=MAX(subscribers.updates_opt_in, excluded.updates_opt_in),
      updated_at=excluded.updated_at, last_send_status='pending'
    RETURNING id, updates_opt_in`)
    .bind(crypto.randomUUID(), email, platform, updates ? 1 : 0, consentVersion, time, time)
    .first<{ id: string; updates_opt_in: number }>();
  if (!subscriber) throw new Error('subscriber-save');
  // The D1 insert trigger queued any new signup in the same transaction.
  ctx.waitUntil(notifySignups(env));
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  const tokenHash = await hash(`${platform}:${token}`);
  await env.DB.prepare('INSERT INTO download_tokens (token_hash, subscriber_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(tokenHash, subscriber.id, time, time + week).run();
  const link = (os: string) => `${env.DOWNLOAD_ORIGIN}/download?token=${token}&platform=${os}`;
  const message = downloadEmail({ platform, url: link(platform), updates: Boolean(subscriber.updates_opt_in) });
  try {
    const result = await env.EMAIL.send({ from: { email: senderAddress, name: 'Pilum' }, to: email, replyTo: senderAddress, ...message });
    await env.DB.prepare("UPDATE subscribers SET last_send_status='sent', last_sent_at=?, message_id=? WHERE id=?")
      .bind(time, result.messageId, subscriber.id).run();
  } catch {
    // No provider error, recipient, address or bearer token goes into public responses/logs.
    await env.DB.batch([
      env.DB.prepare('DELETE FROM download_tokens WHERE token_hash=?').bind(tokenHash),
      env.DB.prepare("UPDATE subscribers SET last_send_status='failed' WHERE id=?").bind(subscriber.id),
    ]);
    return json({ message: 'We couldn’t send your download email. Please try again shortly.' }, 503, origin);
  }
  return json(accepted, 202, origin);
}

async function latestInstaller(platform: 'mac' | 'windows') {
  // Resolve each OS manifest independently: the current Mac and Windows versions differ.
  const manifestUrl = `https://github.com/PilumRTS/releases/releases/latest/download/release-manifest-${platform}.json`;
  const response = await fetch(manifestUrl, { headers: { 'User-Agent': 'Pilum-downloads', 'Accept': 'application/json' }, cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
  if (!response.ok) throw new Error('release-feed');
  const manifest = await response.json() as { version?: unknown; installer?: unknown };
  const version = typeof manifest.version === 'string' ? manifest.version : '';
  const installer = typeof manifest.installer === 'string' ? manifest.installer : '';
  const suffix = platform === 'mac' ? '.dmg' : '-setup.exe';
  if (!/^\d+\.\d+\.\d+(?:[-+][a-z0-9.-]+)?$/i.test(version) || !/^[a-z0-9._-]+$/i.test(installer) || !installer.endsWith(suffix)) throw new Error('release-feed');
  return `https://github.com/PilumRTS/releases/releases/download/v${version}/${installer}`;
}

function downloadError(message: string, status: number) {
  const h = headers();
  h.set('Content-Type', 'text/html; charset=utf-8');
  h.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pilum downloads</title><body style="margin:0;padding:15vh 24px;background:#0d0c0a;color:#ecdfc3;font:18px/1.6 Arial,sans-serif;text-align:center;"><h1 style="color:#c3a067;letter-spacing:4px;">PILUM</h1><p>${message}</p><a style="color:#f0ad4a;" href="https://pilumrts.com/#download">Request new download links</a></body></html>`, { status, headers: h });
}

async function download(request: Request, env: Env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const platform = url.searchParams.get('platform');
  if (!/^[a-f0-9]{64}$/.test(token) || (platform !== 'mac' && platform !== 'windows')) return downloadError('This download link is incomplete. Request a fresh email below.', 400);
  const platformHash = await hash(`${platform}:${token}`);
  // Honor the original authorized two-platform test email until its seven-day expiry.
  // New tokens only store platformHash, so changing their platform cannot find a record.
  const legacyHash = await hash(token);
  const record = await env.DB.prepare('SELECT token_hash, subscriber_id, expires_at FROM download_tokens WHERE token_hash IN (?, ?)')
    .bind(platformHash, legacyHash).first<{ token_hash: string; subscriber_id: string; expires_at: number }>();
  const tokenHash = record?.token_hash;
  if (!record || record.expires_at <= now()) return downloadError('This download link has expired. Request a fresh email below.', 410);
  let location: string;
  try { location = await latestInstaller(platform); }
  catch { return downloadError('The latest build is temporarily unavailable. Please try this link again shortly.', 503); }
  if (request.method !== 'HEAD') await env.DB.batch([
    env.DB.prepare('UPDATE subscribers SET verified_at=COALESCE(verified_at, ?) WHERE id=?').bind(now(), record.subscriber_id),
    env.DB.prepare('UPDATE download_tokens SET last_used_at=? WHERE token_hash=?').bind(now(), tokenHash),
  ]);
  const h = headers();
  h.set('Location', location);
  return new Response(null, { status: 302, headers: h });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if ((url.pathname === '/assets/pilum-wordmark-din-v1.png' || url.pathname === '/assets/pilum-helmet-cream-v1.png') && (request.method === 'GET' || request.method === 'HEAD')) {
      const png = url.pathname.endsWith('pilum-helmet-cream-v1.png') ? helmetPng : wordmarkPng;
      const bytes = Uint8Array.from(atob(png), char => char.charCodeAt(0));
      return new Response(request.method === 'HEAD' ? null : bytes, { headers: {
        'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff',
      } });
    }
    if (url.pathname === '/request') {
      const origin = request.headers.get('Origin');
      if (request.method === 'OPTIONS') {
        if (origin !== env.SITE_ORIGIN) return new Response(null, { status: 403 });
        const h = headers(origin ?? undefined);
        h.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        h.set('Access-Control-Allow-Headers', 'Content-Type');
        h.set('Access-Control-Max-Age', '600');
        return new Response(null, { status: 204, headers: h });
      }
      if (request.method !== 'POST') return json({ message: 'Use the download form on pilumrts.com.' }, 405, origin === env.SITE_ORIGIN ? origin : undefined, { Allow: 'POST, OPTIONS' });
      try { return await requestDownloads(request, env, ctx); }
      catch { return json({ message: 'Downloads by email are temporarily unavailable. Please try again shortly.' }, 503, origin === env.SITE_ORIGIN ? origin : undefined); }
    }
    if (url.pathname === '/download' && (request.method === 'GET' || request.method === 'HEAD')) {
      try { return await download(request, env); }
      catch { return downloadError('Downloads are temporarily unavailable. Please try again shortly.', 503); }
    }
    return new Response('Not found', { status: 404, headers: headers() });
  },
  async scheduled(_controller: unknown, env: Env) {
    await notifySignups(env);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM download_tokens WHERE expires_at <= ?').bind(now()),
      env.DB.prepare('DELETE FROM request_limits WHERE expires_at <= ?').bind(now()),
    ]);
  },
};
