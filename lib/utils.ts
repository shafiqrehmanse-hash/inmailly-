export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function getReferralCode(memberId: string) {
  return "REF-" + memberId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function findMemberIdByReferralCode(
  members: { id: string }[],
  code: string
) {
  const normalized = code.toUpperCase();
  return members.find((m) => getReferralCode(m.id) === normalized)?.id ?? null;
}

export function truncateUrl(url: string, max = 48) {
  const display = url.replace(/^https?:\/\//, "");
  return display.length > max ? display.slice(0, max) + "…" : display;
}
