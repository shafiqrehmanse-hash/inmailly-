export function getWeekStartDate(d = new Date()): string {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

export function getWeekEndDate(weekStart: string): Date {
  const end = new Date(`${weekStart}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 7);
  return end;
}
