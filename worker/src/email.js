/**
 * Table layout and inline colours survive email clients that strip site CSS/fonts.
 * @param {{ platform: "mac" | "windows", url: string, updates: boolean }} links
 */
export function downloadEmail({ platform, url, updates }) {
  const label = platform === "mac" ? "Mac" : "Windows";
  const instructions = platform === "mac"
    ? "If macOS blocks first launch, use System Settings → Privacy &amp; Security → Open Anyway."
    : "On first opening the installer, SmartScreen may show “Windows protected your PC”. Click <strong>More info</strong> → <strong>Run anyway</strong>.";
  const plainInstructions = platform === "mac"
    ? "If macOS blocks first launch, use System Settings > Privacy & Security > Open Anyway."
    : "On first opening the installer, SmartScreen may show “Windows protected your PC”. Click More info > Run anyway.";
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark"><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&amp;family=Saira+Condensed:wght@500;700&amp;display=swap" rel="stylesheet"><!-- Wordmark rendered from DIN Schablonierschrift by Marian Steinbach, CC SA 1.0: https://creativecommons.org/licenses/sa/1.0/ --><title>Your Pilum alpha for ${label}</title></head>
<body style="margin:0;padding:0;background:#0d0c0a;color:#d8ccb2;font-family:'IBM Plex Sans',Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your ${label} alpha download is ready.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d0c0a;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;border:1px solid #493b27;background:#15130f;">
<tr><td align="center" style="padding:40px 28px 28px;border-bottom:1px solid #493b27;">
<img src="https://downloads.pilumrts.com/assets/pilum-helmet-cream-v1.png" width="72" height="72" alt="Pilum helmet" style="display:block;margin:0 auto 20px;border:0;">
<p style="margin:0 0 18px;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#f0ad4a;">EARLY ALPHA</p>
<img src="https://downloads.pilumrts.com/assets/pilum-wordmark-din-v1.png" width="220" height="68" alt="PILUM" style="display:block;width:220px;max-width:100%;height:auto;margin:0 auto;border:0;">
<p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#c3a067;">A grimdark tactical RTS of frontier colonies and war.</p>
</td></tr>
<tr><td style="padding:32px 28px 36px;">
<h1 style="margin:0 0 16px;color:#ecdfc3;font-family:'Saira Condensed',Impact,'Arial Narrow',Arial,sans-serif;font-size:30px;line-height:1.15;font-weight:normal;text-transform:uppercase;letter-spacing:1px;">You're cleared to ship out.</h1>
<p style="margin:0 0 26px;font-size:16px;line-height:1.65;">Your ${label} alpha download is ready. Join us on the frontier.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td bgcolor="#e0962f" align="center" style="border:1px solid #f0ad4a;"><a href="${url}" style="display:block;padding:17px 16px;color:#17110a;font-family:'Arial Narrow',Arial,sans-serif;font-size:14px;line-height:1.3;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Download for ${label}</a></td></tr></table>
<p style="margin:22px 0 0;font-size:12px;line-height:1.65;color:#9a8e76;">This link works for seven days and delivers the latest alpha. Need it again? Request a new email at <a href="https://pilumrts.com/#download" style="color:#c3a067;">pilumrts.com</a>.</p>
<p style="margin:22px 0 0;font-size:13px;line-height:1.65;color:#d8ccb2;">${instructions}</p>
<p style="margin:26px 0 0;font-size:14px;line-height:1.6;">Watch development on <a href="https://www.youtube.com/@PilumRTS" style="color:#f0ad4a;">YouTube</a> and join us on <a href="https://discord.gg/pv4KJVRcn3" style="color:#f0ad4a;">Discord</a>. You can also reply to this email.</p>
</td></tr>
<tr><td style="padding:22px 28px;border-top:1px solid #493b27;font-size:11px;line-height:1.7;color:#9a8e76;">You requested this download link on pilumrts.com. ${updates ? 'You also asked to hear about Pilum updates. Reply “unsubscribe” at any time.' : 'This request does not subscribe you to update emails.'}<br>Didn't request this? You can ignore it, or contact <a href="mailto:info@pilumrts.com" style="color:#c3a067;">info@pilumrts.com</a>.<br>© 2026 Pilum. Early alpha.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `PILUM — EARLY ALPHA
A grimdark tactical RTS of frontier colonies and war.

You're cleared to ship out.

Download for ${label}: ${url}

This link works for seven days and delivers the latest alpha. Request a new link at https://pilumrts.com/#download.

${plainInstructions}

YouTube: https://www.youtube.com/@PilumRTS
Discord: https://discord.gg/pv4KJVRcn3
Reply to this email with feedback.

You requested this link on pilumrts.com. ${updates ? 'You also asked to hear about Pilum updates. Reply unsubscribe at any time.' : 'This request does not subscribe you to update emails.'}
Didn't request this? Ignore it, or contact info@pilumrts.com.
© 2026 Pilum. Early alpha.`;
  return { subject: `Your Pilum alpha for ${label}`, html, text };
}
