/**
 * Public site URL — set NEXT_PUBLIC_APP_URL in Vercel when custom domain is live.
 * Used for client portal links, referral URLs, password reset emails, etc.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://inmailly.vercel.app";
}
