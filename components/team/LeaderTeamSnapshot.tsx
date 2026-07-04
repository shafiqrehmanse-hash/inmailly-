import Link from "next/link";
import { computeTeamPerformance } from "@/lib/team-performance";
import { getLeaderAssignedWorkerIds } from "@/lib/team-leader-scope";
import { getCurrentMember } from "@/lib/team";

export default async function LeaderTeamSnapshot() {
  const member = await getCurrentMember();
  if (!member) return null;

  const assignedIds = new Set(await getLeaderAssignedWorkerIds(member.id));
  const data = await computeTeamPerformance();
  const workers = data.members.filter((m) => assignedIds.has(m.id));

  const usedToday = workers.reduce((s, m) => s + m.usedToday, 0);
  const leadsToday = workers.reduce((s, m) => s + m.leadsToday, 0);
  const needsAttention = workers.filter((m) => m.needsAttention).length;

  return (
    <div className="lux-card-elite p-5 border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] via-transparent to-lux-violet/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-amber-400">Your team snapshot</p>
          <p className="text-sm text-lux-muted mt-1">
            {workers.length} assigned worker{workers.length === 1 ? "" : "s"} — only your team
          </p>
        </div>
        <Link href="/team/leader" className="text-xs font-bold text-lux-cyan hover:underline">
          Open leader workspace →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Your workers", value: workers.length },
          { label: "Used today", value: usedToday },
          { label: "Leads today", value: leadsToday },
          {
            label: "Need attention",
            value: needsAttention,
            warn: needsAttention > 0,
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
      {workers.length === 0 && (
        <p className="text-xs text-amber-200/80 mt-3">
          No workers assigned yet. Admin must assign members to you in Team members.
        </p>
      )}
    </div>
  );
}
