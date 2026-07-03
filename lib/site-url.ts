/**
 * Public site URL — set NEXT_PUBLIC_APP_URL in Vercel when custom domain is live.
 * Used for client portal links, referral URLs, password reset emails, etc.
 */
export function getSiteUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://www.inmailly.com";

  url = url.replace(/\/$/, "");

  // Canonical host — bare inmailly.com 308-redirects and breaks cross-origin iframes
  if (/^https:\/\/inmailly\.com/i.test(url)) {
    url = url.replace(/^https:\/\/inmailly\.com/i, "https://www.inmailly.com");
  }

  return url;
}
