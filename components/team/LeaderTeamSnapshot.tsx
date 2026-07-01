import Link from "next/link";
import { computeTeamPerformance } from "@/lib/team-performance";

export default async function LeaderTeamSnapshot() {
  const data = await computeTeamPerformance();

  return (
    <div className="lux-card-elite p-5 border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-lux-violet/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-amber-400">Team snapshot</p>
          <p className="text-sm text-lux-muted mt-1">Live outreach overview for your team</p>
        </div>
        <Link href="/team/leader" className="text-xs font-bold text-lux-cyan hover:underline">
          Open leader workspace →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Pool", value: data.totals.poolAvailable },
          { label: "Used today", value: data.totals.usedToday },
          { label: "Leads today", value: data.totals.leadsToday },
          {
            label: "Need attention",
            value: data.totals.needsAttention,
            warn: data.totals.needsAttention > 0,
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-center">
            <div className={`text-xl font-bold tabular-nums ${s.warn ? "text-amber-400" : "text-lux-cyan"}`}>
              {s.value}
            </div>
            <div className="text-[0.58rem] uppercase tracking-wide text-lux-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
