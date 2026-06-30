/** Build a readable invite code from a label/name, e.g. "Hania batch" → HANIABATCH-A3F2 */
export function inviteCodeFromLabel(label: string) {
  const slug = label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return slug ? `${slug}-${suffix}` : `INMAILLY-${suffix}`;
}
