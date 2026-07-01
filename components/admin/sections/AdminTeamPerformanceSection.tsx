"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminWeeklyGoalCard from "@/components/admin/AdminWeeklyGoalCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useAdminKey } from "@/lib/admin-context";
import { cn, formatDate, formatRelative } from "@/lib/utils";

type MemberPerformance = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string | null;
  claimed: number;
  used: number;
  usedToday: number;
  usedWeek: number;
  leads: number;
  leadsToday: number;
  leadsWeek: number;
  responses: number;
  dealsClosed: number;
  staleClaimed: number;
  productivityScore: number;
  rank: number;
  inactive24h: boolean;
  needsAttention: boolean;
  dailyUsed: number[];
  conversionRate: number;
  autoAssignWeek: number;
  lastAutoAssignAt: string | null;
};

type PerformanceData = {
  members: MemberPerformance[];
  totals: {
    claimed: number;
    used: number;
    usedToday: number;
    leads: number;
    leadsToday: number;
    inactive: number;
    needsAttention: number;
    autoAssignLinksToday?: number;
    autoAssignBatchesToday?: number;
  };
  dayLabels: string[];
};

export default function AdminTeamPerformanceSection() {
  const adminKey = useAdminKey();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [autoFeed, setAutoFeed] = useState<
    { memberName: string; assigned_count: number; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "used" | "claimed" | "leads">("score");

  const load = useCallback(async () => {
    setLoading(true);
    const [perfRes, autoRes] = await Promise.all([
      fetch(`/api/admin/team/performance?key=${adminKey}`),
      fetch(`/api/admin/team/auto-assign?key=${adminKey}`),
    ]);
    setData(await perfRes.json());
    const autoJson = await autoRes.json();
    setAutoFeed(autoJson.recent || []);
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...(data?.members || [])].sort((a, b) => {
    if (sortBy === "score") return b.productivityScore - a.productivityScore;
    if (sortBy === "used") return b.used - a.used;
    if (sortBy === "claimed") return b.claimed - a.claimed;
    return b.leads - a.leads;
  });

  const top3 = sorted.slice(0, 3);
  const maxDaily = Math.max(1, ...sorted.flatMap((m) => m.dailyUsed));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">📊 Team performance</h1>
          <p className="text-sm text-lux-muted mt-1 max-w-xl">
            Claimed & used links, leads, leaderboard, and inactive alerts — all outreach members in one place.
          </p>
        </div>
        <Button variant="lux-soft" size="sm" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {(data?.totals?.needsAttention ?? 0) > 0 && data?.totals && (
        <div className="lux-card-elite border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-lux-muted">
          <strong className="text-amber-300">{data.totals.needsAttention} member(s) need attention</strong> — inactive
          24h+, stale claimed links (48h+), or many claims with zero completions.
        </div>
      )}

      <AdminWeeklyGoalCard />

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <AdminStatCard value={data.members.length} label="Active team" />
          <AdminStatCard value={data.totals.claimed} label="Claimed now" />
          <AdminStatCard value={data.totals.used} label="Total used" />
          <AdminStatCard value={data.totals.usedToday} label="Used today" />
          <AdminStatCard value={data.totals.leadsToday} label="Leads today" />
          <AdminStatCard value={data.totals.autoAssignLinksToday ?? 0} label="Auto-assigned today" />
          <AdminStatCard value={data.totals.inactive} label="Inactive 24h" />
        </div>
      )}

      {autoFeed.length > 0 && (
        <div className="lux-card-elite p-4 border-lux-violet/20">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-violet mb-3">
            Recent self-serve auto-assigns
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto lux-scrollbar-hide">
            {autoFeed.slice(0, 8).map((e) => (
              <div
                key={e.created_at + e.memberName + e.assigned_count}
                className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-white/[0.04] pb-2 last:border-0"
              >
                <span className="text-lux-text font-medium">{e.memberName}</span>
                <span className="text-lux-cyan font-semibold tabular-nums">+{e.assigned_count} links</span>
                <span className="text-[0.65rem] text-lux-muted">{formatRelative(e.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {top3.length > 0 && !loading && (
        <div className="grid sm:grid-cols-3 gap-3">
          {top3.map((m, i) => (
            <div
              key={m.id}
              className={cn(
                "lux-card-elite p-4 text-center",
                i === 0 && "border-lux-violet/35 shadow-[0_0_32px_rgba(139,92,246,0.1)]",
                i === 1 && "border-lux-cyan/25",
                i === 2 && "border-white/15"
              )}
            >
              <div className="text-2xl mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
              <div className="font-bricolage font-extrabold text-lux-text truncate">{m.name}</div>
              <div className="text-xs text-lux-muted mt-1">Score {m.productivityScore}</div>
              <div className="text-[0.65rem] text-lux-cyan mt-2 tabular-nums">
                {m.usedWeek} used · {m.leadsWeek} leads this week
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-muted">Sort by</span>
        {(
          [
            ["score", "Productivity"],
            ["used", "Used"],
            ["claimed", "Claimed"],
            ["leads", "Leads"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortBy(key)}
            className={cn("lux-tab-pill text-[0.72rem] py-1.5", sortBy === key && "lux-tab-pill-active")}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="lux-skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="lux-card-elite overflow-hidden">
          <div className="overflow-x-auto lux-scrollbar-hide">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-[0.62rem] uppercase tracking-wider text-lux-muted">
                  <th className="px-4 py-3 font-bold">#</th>
                  <th className="px-4 py-3 font-bold">Member</th>
                  <th className="px-4 py-3 font-bold text-center">Claimed</th>
                  <th className="px-4 py-3 font-bold text-center">Used</th>
                  <th className="px-4 py-3 font-bold text-center">Today</th>
                  <th className="px-4 py-3 font-bold text-center">Leads</th>
                  <th className="px-4 py-3 font-bold text-center">Responses</th>
                  <th className="px-4 py-3 font-bold text-center">Score</th>
                  <th className="px-4 py-3 font-bold text-center">Auto (7d)</th>
                  <th className="px-4 py-3 font-bold">Last active</th>
                  <th className="px-4 py-3 font-bold">7-day activity</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-white/[0.04] hover:bg-lux-violet/[0.04] transition-colors"
                  >
                    <td className="px-4 py-3 font-bricolage font-bold text-lux-violet tabular-nums">
                      {m.rank}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-lux-text">{m.name}</div>
                      <div className="text-[0.65rem] text-lux-muted truncate max-w-[140px]">{m.email}</div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      <Link
                        href={`/admin/team/links?memberId=${m.id}`}
                        className="text-lux-cyan hover:underline font-semibold"
                      >
                        {m.claimed}
                      </Link>
                      {m.staleClaimed > 0 && (
                        <div className="text-[0.58rem] text-amber-400">{m.staleClaimed} stale</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums font-semibold text-lux-text">
                      {m.used}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-lux-muted">
                      {m.usedToday}u · {m.leadsToday}l
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">{m.leads}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{m.responses}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bricolage font-extrabold text-lux-cyan tabular-nums">
                        {m.productivityScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-lux-violet font-semibold">
                      {m.autoAssignWeek > 0 ? (
                        <>
                          +{m.autoAssignWeek}
                          {m.lastAutoAssignAt && (
                            <div className="text-[0.58rem] text-lux-muted font-normal">
                              {formatRelative(m.lastAutoAssignAt)}
                            </div>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-[0.72rem] text-lux-muted whitespace-nowrap">
                      {m.lastLogin ? (
                        <>
                          {formatRelative(m.lastLogin)}
                          <div className="text-[0.58rem] opacity-70">{formatDate(m.lastLogin)}</div>
                        </>
                      ) : (
                        <span className="text-red-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-end gap-0.5 h-8 w-[72px]">
                        {m.dailyUsed.map((v, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm bg-gradient-to-t from-lux-violet to-lux-cyan min-w-[6px]"
                            style={{ height: `${(v / maxDaily) * 100}%`, minHeight: v ? 3 : 0 }}
                            title={`${data?.dayLabels[i]}: ${v} used`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.inactive24h ? (
                        <Badge variant="dead">Inactive 24h</Badge>
                      ) : m.needsAttention ? (
                        <Badge variant="follow_up">Needs focus</Badge>
                      ) : m.usedToday > 0 || m.leadsToday > 0 ? (
                        <Badge variant="available">Active today</Badge>
                      ) : (
                        <Badge variant="used">Idle</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="lux-card-elite p-4 text-[0.8rem] text-lux-muted leading-relaxed border-lux-violet/15">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-violet mb-2">
          How productivity score works
        </p>
        Weekly used links ×10 + weekly leads ×15 + today&apos;s used ×5 + today&apos;s leads ×8. Leaderboard
        updates on refresh. Stale = claimed 48h+ without completing outreach.
      </div>
    </div>
  );
}
