/**
 * Detect only supported desktop platforms; unknown devices keep the page's default order.
 * @param {{ userAgentData?: { platform?: string }, platform?: string, userAgent?: string }} device
 * @returns {'mac' | 'windows' | undefined}
 */
export function detectDownloadPlatform(device) {
  const hints = [device.userAgentData?.platform, device.platform, device.userAgent];
  for (const hint of hints) {
    if (!hint) continue;
    if (/windows|win32|win64|wince/i.test(hint)) return 'windows';
    if (/macos|macintosh|macintel|macppc|mac68k|mac os x/i.test(hint)) return 'mac';
  }
  return undefined;
}
