"use client";

import { useMemo } from "react";

type Point = { day: string; label: string; leads: number; links: number };

function bucketByDay(
  dates: (string | null)[],
  days: number
): Map<string, number> {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const raw of dates) {
    if (!raw) continue;
    const key = raw.slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

export default function TeamProgressChart({
  leadDates,
  linkDates,
}: {
  leadDates: string[];
  linkDates: string[];
}) {
  const points = useMemo(() => {
    const leadMap = bucketByDay(leadDates, 7);
    const linkMap = bucketByDay(linkDates, 7);
    const pts: Point[] = [];
    leadMap.forEach((leads, day) => {
      const d = new Date(day + "T12:00:00");
      pts.push({
        day,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        leads,
        links: linkMap.get(day) || 0,
      });
    });
    return pts;
  }, [leadDates, linkDates]);

  const totalLeads = points.reduce((s, p) => s + p.leads, 0);
  const prevLeads = leadDates.filter((d) => {
    const cut = new Date();
    cut.setDate(cut.getDate() - 7);
    const t = new Date(d);
    const start = new Date();
    start.setDate(start.getDate() - 14);
    return t >= start && t < cut;
  }).length;
  const trend =
    prevLeads === 0 ? (totalLeads > 0 ? 100 : 0) : Math.round(((totalLeads - prevLeads) / prevLeads) * 100);
  const maxVal = Math.max(1, ...points.map((p) => Math.max(p.leads, p.links)));

  return (
    <div className="lux-card-elite p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-1">
            Your progress
          </p>
          <h2 className="font-bricolage font-extrabold text-xl text-lux-text">Last 7 days</h2>
        </div>
        <div className="text-right">
          <div
            className={`font-bricolage font-extrabold text-2xl tabular-nums ${
              trend >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
          <div className="text-[0.65rem] text-lux-muted uppercase tracking-wider">vs prior week</div>
        </div>
      </div>

      <div className="flex items-end gap-2 h-[140px] mb-4">
        {points.map((p) => (
          <div key={p.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="w-full flex items-end justify-center gap-0.5 h-[100px]">
              <div
                className="w-[42%] rounded-t-sm bg-gradient-to-t from-lux-blue to-lux-cyan/80 transition-all shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                style={{ height: `${(p.leads / maxVal) * 100}%`, minHeight: p.leads ? 4 : 0 }}
                title={`${p.leads} leads`}
              />
              <div
                className="w-[42%] rounded-t-sm bg-gradient-to-t from-lux-violet/80 to-lux-cyan/60 transition-all shadow-[0_0_12px_rgba(139,92,246,0.12)]"
                style={{ height: `${(p.links / maxVal) * 100}%`, minHeight: p.links ? 4 : 0 }}
                title={`${p.links} links used`}
              />
            </div>
            <span className="text-[0.6rem] text-lux-muted uppercase">{p.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-6 text-[0.7rem] text-lux-muted">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-lux-blue/80" /> Leads added
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-lux-cyan/70" /> Links used
        </span>
      </div>
    </div>
  );
}
