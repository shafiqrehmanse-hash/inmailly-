/** Normalize a pasted LinkedIn profile URL. Empty is allowed. */
export function normalizeLinkedInProfileUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let href = trimmed;
  if (!/^https?:\/\//i.test(href)) href = `https://${href.replace(/^\/\//, "")}`;

  let parsed: URL;
  try {
    parsed = new URL(href);
  } catch {
    throw new Error("Enter a valid LinkedIn profile link, e.g. https://www.linkedin.com/in/your-name");
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
    throw new Error("Use a LinkedIn URL (linkedin.com/in/…)");
  }

  parsed.hash = "";
  return parsed.toString();
}

export function linkedinHref(url: string | null | undefined) {
  if (!url?.trim()) return null;
  try {
    return normalizeLinkedInProfileUrl(url);
  } catch {
    return url.startsWith("http") ? url : `https://${url}`;
  }
}
