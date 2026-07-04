"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatCard from "@/components/team/StatCard";
import type { MemberPerformance, TeamPerformanceData } from "@/lib/team-performance";
import { PRODUCTIVITY_SCORE_FORMULA } from "@/lib/team-performance";
import { cn, formatDate, formatRelative } from "@/lib/utils";

type SortKey = "score" | "used" | "claimed" | "leads" | "deals" | "referrals";

export default function TeamPerformanceBoard({
  data,
  loading,
  onRefresh,
  mode,
  currentMemberId,
  autoFeed,
}: {
  data: TeamPerformanceData | null;
  loading: boolean;
  onRefresh: () => void;
  mode: "admin" | "team";
  currentMemberId?: string | null;
  autoFeed?: { memberName: string; assigned_count: number; created_at: string }[];
}) {
  const [sortBy, setSortBy] = useState<SortKey>("score");

  const sorted = useMemo(() => {
    const rows = [...(data?.members || [])];
    rows.sort((a, b) => {
      if (sortBy === "score") return b.productivityScore - a.productivityScore;
      if (sortBy === "used") return b.used - a.used;
      if (sortBy === "claimed") return b.claimed - a.claimed;
      if (sortBy === "leads") return b.leads - a.leads;
      if (sortBy === "deals") return b.dealsClosed - a.dealsClosed;
      return b.referralsJoined - a.referralsJoined;
    });
    return rows;
  }, [data?.members, sortBy]);

  const top3 = sorted.slice(0, 3);
  const maxDaily = Math.max(1, ...sorted.flatMap((m) => m.dailyUsed));
  const you = currentMemberId ? sorted.find((m) => m.id === currentMemberId) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">📊 Team performance</h1>
          <p className="text-sm text-lux-muted mt-1 max-w-xl">
            {mode === "team"
              ? "Everyone on the outreach team can see this board. Climb the ranks with used links, leads, closed deals, and referral SDRs."
              : "Claimed & used links, leads, closed deals, referral SDRs, and inactive alerts — all outreach members in one place."}
          </p>
        </div>
        <Button variant="lux-soft" size="sm" onClick={onRefresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {mode === "team" && you && (
        <div className="lux-card-elite border-lux-cyan/30 bg-lux-cyan/[0.06] px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-cyan">Your rank</p>
            <p className="font-bricolage font-extrabold text-xl text-lux-text">
              #{you.rank} · Score {you.productivityScore}
            </p>
          </div>
          <div className="text-sm text-lux-muted tabular-nums">
            🏆 {you.dealsClosed} deals · ✦ {you.referralsJoined} referral SDRs
          </div>
        </div>
      )}

      {mode === "admin" && (data?.totals?.needsAttention ?? 0) > 0 && data?.totals && (
        <div className="lux-card-elite border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-lux-muted">
          <strong className="text-amber-300">{data.totals.needsAttention} member(s) need attention</strong> — inactive
          24h+, stale claimed links (48h+), or many claims with zero completions.
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
          <StatCard value={data.members.length} label="Active team" />
          <StatCard value={data.totals.claimed} label="Claimed now" />
          <StatCard value={data.totals.usedToday} label="Used today" />
          <StatCard value={data.totals.leadsToday} label="Leads today" />
          <StatCard value={data.totals.dealsClosed} label="Closed deals" />
          <StatCard value={data.totals.referralsJoined} label="Referral SDRs" />
          {mode === "admin" && (
            <StatCard value={data.totals.autoAssignLinksToday ?? 0} label="Auto-assigned today" />
          )}
          {mode === "admin" && <StatCard value={data.totals.inactive} label="Inactive 24h" />}
        </div>
      )}

      {mode === "admin" && autoFeed && autoFeed.length > 0 && (
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
                i === 2 && "border-white/15",
                currentMemberId === m.id && "ring-1 ring-lux-cyan/40"
              )}
            >
              <div className="text-2xl mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
              <div className="font-bricolage font-extrabold text-lux-text truncate">
                {m.name}
                {currentMemberId === m.id ? " (you)" : ""}
              </div>
              <div className="text-xs text-lux-muted mt-1">Score {m.productivityScore}</div>
              <div className="text-[0.65rem] text-lux-cyan mt-2 tabular-nums">
                {m.usedWeek} used · {m.leadsWeek} leads · 🏆 {m.dealsClosed} deals
              </div>
              {m.referralsJoined > 0 && (
                <div className="text-[0.65rem] text-amber-300 mt-1">✦ {m.referralsJoined} referral SDRs</div>
              )}
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
            ["deals", "Deals"],
            ["referrals", "Referrals"],
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
                  <th className="px-4 py-3 font-bold text-center">Deals</th>
                  <th className="px-4 py-3 font-bold text-center">Referral SDRs</th>
                  <th className="px-4 py-3 font-bold text-center">Score</th>
                  {mode === "admin" && (
                    <th className="px-4 py-3 font-bold text-center">Auto (7d)</th>
                  )}
                  <th className="px-4 py-3 font-bold">Last active</th>
                  <th className="px-4 py-3 font-bold">7-day activity</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => (
                  <MemberRow
                    key={m.id}
                    m={m}
                    mode={mode}
                    isYou={currentMemberId === m.id}
                    maxDaily={maxDaily}
                    dayLabels={data?.dayLabels || []}
                  />
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
        {data?.scoreFormula || PRODUCTIVITY_SCORE_FORMULA}. Closed deals and referral SDRs boost your rank the most —
        close wins and invite teammates with your referral link. Leaderboard updates on refresh. Stale = claimed 48h+
        without completing outreach.
      </div>
    </div>
  );
}

function MemberRow({
  m,
  mode,
  isYou,
  maxDaily,
  dayLabels,
}: {
  m: MemberPerformance;
  mode: "admin" | "team";
  isYou: boolean;
  maxDaily: number;
  dayLabels: string[];
}) {
  return (
    <tr
      className={cn(
        "border-b border-white/[0.04] hover:bg-lux-violet/[0.04] transition-colors",
        isYou && "bg-lux-cyan/[0.06]"
      )}
    >
      <td className="px-4 py-3 font-bricolage font-bold text-lux-violet tabular-nums">{m.rank}</td>
      <td className="px-4 py-3">
        <div className="font-semibold text-lux-text">
          {m.name}
          {isYou && (
            <span className="ml-2 text-[0.62rem] uppercase tracking-wide text-lux-cyan font-bold">You</span>
          )}
        </div>
        {mode === "admin" && (
          <div className="text-[0.65rem] text-lux-muted truncate max-w-[140px]">{m.email}</div>
        )}
      </td>
      <td className="px-4 py-3 text-center tabular-nums">
        {mode === "admin" ? (
          <Link
            href={`/admin/team/links?memberId=${m.id}`}
            className="text-lux-cyan hover:underline font-semibold"
          >
            {m.claimed}
          </Link>
        ) : (
          <span className="font-semibold">{m.claimed}</span>
        )}
        {m.staleClaimed > 0 && mode === "admin" && (
          <div className="text-[0.58rem] text-amber-400">{m.staleClaimed} stale</div>
        )}
      </td>
      <td className="px-4 py-3 text-center tabular-nums font-semibold text-lux-text">{m.used}</td>
      <td className="px-4 py-3 text-center tabular-nums text-lux-muted">
        {m.usedToday}u · {m.leadsToday}l
      </td>
      <td className="px-4 py-3 text-center tabular-nums">{m.leads}</td>
      <td className="px-4 py-3 text-center tabular-nums">{m.responses}</td>
      <td className="px-4 py-3 text-center tabular-nums">
        <span className="font-semibold text-amber-300">🏆 {m.dealsClosed}</span>
        {m.dealsClosedWeek > 0 && (
          <div className="text-[0.58rem] text-lux-muted">+{m.dealsClosedWeek} this week</div>
        )}
      </td>
      <td className="px-4 py-3 text-center tabular-nums">
        {m.referralsJoined > 0 ? (
          <span className="font-semibold text-amber-200">✦ {m.referralsJoined}</span>
        ) : (
          <span className="text-lux-muted">0</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="font-bricolage font-extrabold text-lux-cyan tabular-nums">{m.productivityScore}</span>
      </td>
      {mode === "admin" && (
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
      )}
      <td className="px-4 py-3 text-[0.72rem] text-lux-muted whitespace-nowrap">
        {m.lastLogin ? (
          <>
            {formatRelative(m.lastLogin)}
            {mode === "admin" && (
              <div className="text-[0.58rem] opacity-70">{formatDate(m.lastLogin)}</div>
            )}
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
              title={`${dayLabels[i]}: ${v} used`}
            />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        {m.inactive24h ? (
          <Badge variant="dead">Inactive 24h</Badge>
        ) : m.needsAttention && mode === "admin" ? (
          <Badge variant="follow_up">Needs focus</Badge>
        ) : m.dealsClosedWeek > 0 ? (
          <Badge variant="available">Closing deals</Badge>
        ) : m.usedToday > 0 || m.leadsToday > 0 ? (
          <Badge variant="available">Active today</Badge>
        ) : (
          <Badge variant="used">Idle</Badge>
        )}
      </td>
    </tr>
  );
}
