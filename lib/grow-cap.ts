/** LinkedIn connection-request cap per member per UTC day. */
export const GROW_DAILY_USED_CAP = 30;

export function utcDayStartIso(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export function remainingGrowToday(usedToday: number) {
  return Math.max(0, GROW_DAILY_USED_CAP - usedToday);
}
