export function normalizeUrl(url: string): string {
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    const parsed = new URL(url);
    // Drop tracking query params but keep path
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return url.replace(/\/+$/, "");
  }
}

function toBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return btoa(str);
}

export function urlKey(url: string): string {
  const u = normalizeUrl(url).toLowerCase();
  const liMatch = u.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (liMatch) return "li:" + decodeURIComponent(liMatch[1]).toLowerCase();
  const salesLead = u.match(/linkedin\.com\/sales\/lead\/([^/?#,]+)/i);
  if (salesLead) return "sn:" + salesLead[1];
  const salesPeople = u.match(/linkedin\.com\/sales\/people\/([^/?#,]+)/i);
  if (salesPeople) return "sn:" + salesPeople[1];
  return "url:" + toBase64(u);
}

function cleanUrlToken(raw: string): string {
  return raw
    .trim()
    .replace(/^[\s,;"'|[\]()]+/, "")
    .replace(/[,;"'<>|[\])}]+$/g, "")
    .replace(/\.+$/g, "");
}

function tryAddUrl(raw: string, seen: Set<string>, results: string[]) {
  const token = cleanUrlToken(raw);
  if (!token || token.length < 8) return;
  if (!/linkedin\.com|https?:\/\/|\.[a-z]{2,}\//i.test(token)) return;
  try {
    const url = normalizeUrl(token);
    const key = urlKey(url);
    if (seen.has(key)) return;
    seen.add(key);
    results.push(url);
  } catch {
    /* skip invalid */
  }
}

/** Pull every URL-like token from a line (comma/tab/semicolon/space separated). */
export function extractUrlsFromLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const results: string[] = [];
  const seen = new Set<string>();

  const addRaw = (raw: string) => tryAddUrl(raw, seen, results);

  const httpRegex = /https?:\/\/[^\s<>"'\])}\]]+/gi;
  let httpMatch: RegExpExecArray | null;
  while ((httpMatch = httpRegex.exec(trimmed)) !== null) {
    addRaw(httpMatch[0]);
  }
  if (results.length > 0) return results;

  const linkedInRegex =
    /(?:https?:\/\/)?(?:[a-z0-9-]+\.)?linkedin\.com\/(?:in\/[^\s,;"'<>|\])}\]]+|sales\/[^\s,;"'<>|\])}\]]+)/gi;
  let liMatch: RegExpExecArray | null;
  while ((liMatch = linkedInRegex.exec(trimmed)) !== null) {
    addRaw(liMatch[0]);
  }
  if (results.length > 0) return results;

  for (const chunk of trimmed.split(/[,;\t|]+/)) {
    const piece = chunk.trim();
    if (!piece) continue;
    const domainMatch = piece.match(
      /(?:https?:\/\/)?(?:www\.)?[a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\/[^\s,;"'<>|\])}\]]*)?/i
    );
    if (domainMatch) addRaw(domainMatch[0]);
  }

  return results;
}

/** Scan entire paste globally — catches tab/comma/space-separated blobs Excel exports. */
export function extractAllUrlsFromPaste(paste: string): string[] {
  const text = paste.replace(/^\uFEFF/, "").trim();
  if (!text) return [];

  const results: string[] = [];
  const seen = new Set<string>();
  const addRaw = (raw: string) => tryAddUrl(raw, seen, results);

  const httpRegex = /https?:\/\/[^\s<>"'\])}\]]+/gi;
  let m: RegExpExecArray | null;
  while ((m = httpRegex.exec(text)) !== null) {
    addRaw(m[0]);
  }

  const linkedInRegex =
    /(?:^|[\s,;|\t(])(?:https?:\/\/)?(?:[a-z0-9-]+\.)?linkedin\.com\/(?:in\/[a-zA-Z0-9_\-%]+|sales\/[^\s,;"'<>|\])}\]]+)/gim;
  while ((m = linkedInRegex.exec(text)) !== null) {
    addRaw(m[0]);
  }

  return results;
}

/** Pull the first URL-like token from a pasted line (with or without https://). */
export function extractUrlFromLine(line: string): string | null {
  const urls = extractUrlsFromLine(line);
  return urls[0] ?? null;
}

export function smartLabel(url: string): string {
  const u = normalizeUrl(url);
  const liMatch = u.match(/linkedin\.com\/in\/([^/?#]+)/i);
  if (liMatch)
    return decodeURIComponent(liMatch[1])
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  if (/linkedin\.com\/sales/i.test(u)) return "Sales Navigator lead";
  try {
    const host = new URL(u).hostname.replace("www.", "");
    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return "Link";
  }
}

export function smartCategory(
  url: string
): "linkedin" | "salesnav" | "email" | "general" {
  const u = url.toLowerCase();
  if (u.includes("linkedin.com/sales")) return "salesnav";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("mailto:") || u.includes("@")) return "email";
  return "general";
}

export function aiHint(category: string): string {
  if (category === "salesnav")
    return "Open in Sales Navigator → send InMail → log response as a lead when they reply.";
  if (category === "linkedin")
    return "View profile → send personalized connect message → mark Used once done → add as Lead if they respond.";
  return "Open link → complete outreach step → mark Used so admin can track progress.";
}

export function parseLinksFromPaste(paste: string): { url: string; key: string }[] {
  const globalUrls = extractAllUrlsFromPaste(paste);
  const seen = new Set<string>();
  const results: { url: string; key: string }[] = [];

  for (const url of globalUrls) {
    const key = urlKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ url, key });
  }

  return results;
}

/** Count raw URL-like tokens before deduplication (for duplicate-in-paste stats). */
export function countRawUrlsInPaste(paste: string): number {
  const text = paste.replace(/^\uFEFF/, "").trim();
  if (!text) return 0;
  let count = 0;
  const httpRegex = /https?:\/\/[^\s<>"'\])}\]]+/gi;
  while (httpRegex.exec(text) !== null) count++;
  if (count > 0) return count;
  const linkedInRegex =
    /(?:^|[\s,;|\t(])(?:https?:\/\/)?(?:[a-z0-9-]+\.)?linkedin\.com\/(?:in\/[a-zA-Z0-9_\-%]+|sales\/[^\s,;"'<>|\])}\]]+)/gim;
  while (linkedInRegex.exec(text) !== null) count++;
  return count;
}

export function categoryIcon(category: string) {
  switch (category) {
    case "salesnav":
      return "🎯";
    case "linkedin":
      return "💼";
    case "email":
      return "✉";
    default:
      return "🔗";
  }
}
