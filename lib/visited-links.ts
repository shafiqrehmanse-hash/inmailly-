const STORAGE_KEY = "inmailly:visited-links";

export function getVisitedLinkIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export function markLinkVisited(id: string): Set<string> {
  const next = getVisitedLinkIds();
  next.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
  return next;
}

export function clearVisitedLinks() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
