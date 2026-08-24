import { getEmailFrom } from "@/lib/email-config";

export type ResendDomainRow = {
  id: string;
  name: string;
  status: string;
};

export type ResendEmailHealth = {
  apiKeySet: boolean;
  configuredFrom: string;
  fromEmail: string;
  fromDomain: string | null;
  domainVerified: boolean;
  verifiedDomains: string[];
  pendingDomains: { name: string; status: string }[];
  resolvedFrom: string;
  usingFallbackFrom: boolean;
  fixSteps: string[];
};

let cachedHealth: { at: number; health: ResendEmailHealth } | null = null;
const CACHE_MS = 60_000;

function parseFromAddress(from: string): { display: string; email: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { display: match[1].trim(), email: match[2].trim().toLowerCase() };
  return { display: "InMailly", email: from.trim().toLowerCase() };
}

export function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).toLowerCase() || null;
}

async function fetchResendDomains(apiKey: string): Promise<ResendDomainRow[]> {
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: ResendDomainRow[] };
  return json.data || [];
}

export async function getResendEmailHealth(options?: { refresh?: boolean }): Promise<ResendEmailHealth> {
  if (!options?.refresh && cachedHealth && Date.now() - cachedHealth.at < CACHE_MS) {
    return cachedHealth.health;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const configuredFrom = getEmailFrom();
  const { display, email: fromEmail } = parseFromAddress(configuredFrom);
  const fromDomain = domainFromEmail(fromEmail);

  const fixSteps = [
    "Open https://resend.com/domains and add inmailly.com if missing.",
    "Copy the SPF + DKIM DNS records into your domain registrar (where you bought inmailly.com).",
    "Wait until Resend shows the domain as Verified (green).",
    "In Vercel, set EMAIL_FROM=InMailly <notifications@inmailly.com> and redeploy if you change it.",
  ];

  if (!apiKey) {
    const health: ResendEmailHealth = {
      apiKeySet: false,
      configuredFrom,
      fromEmail,
      fromDomain,
      domainVerified: false,
      verifiedDomains: [],
      pendingDomains: [],
      resolvedFrom: configuredFrom,
      usingFallbackFrom: false,
      fixSteps: ["Add RESEND_API_KEY in Vercel → Settings → Environment Variables, then redeploy.", ...fixSteps],
    };
    cachedHealth = { at: Date.now(), health };
    return health;
  }

  const domains = await fetchResendDomains(apiKey);
  const verifiedDomains = domains.filter((d) => d.status === "verified").map((d) => d.name.toLowerCase());
  const pendingDomains = domains
    .filter((d) => d.status !== "verified")
    .map((d) => ({ name: d.name, status: d.status }));

  const domainVerified = Boolean(fromDomain && verifiedDomains.includes(fromDomain));

  let resolvedFrom = configuredFrom;
  let usingFallbackFrom = false;

  if (!domainVerified && verifiedDomains.length > 0) {
    const fallbackDomain = verifiedDomains[0];
    resolvedFrom = `${display} <notifications@${fallbackDomain}>`;
    usingFallbackFrom = true;
  }

  const health: ResendEmailHealth = {
    apiKeySet: true,
    configuredFrom,
    fromEmail,
    fromDomain,
    domainVerified: domainVerified || usingFallbackFrom,
    verifiedDomains,
    pendingDomains,
    resolvedFrom,
    usingFallbackFrom,
    fixSteps,
  };

  cachedHealth = { at: Date.now(), health };
  return health;
}

/** From address actually used for Resend sends (falls back to a verified domain when configured). */
export async function resolveSendingFrom(): Promise<string> {
  const health = await getResendEmailHealth();
  return health.resolvedFrom;
}

export function formatResendDomainError(raw: string): string {
  if (raw.toLowerCase().includes("domain is not verified")) {
    return `${raw} Fix: verify inmailly.com at https://resend.com/domains (add DNS records at your domain host). Until then, use Admin → Mark email verified for stuck clients.`;
  }
  return raw;
}
