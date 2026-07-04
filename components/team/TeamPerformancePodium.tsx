"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import TeamAvatar from "@/components/team/TeamAvatar";
import type { MemberPerformance } from "@/lib/team-performance";
import { cn } from "@/lib/utils";

export default function TeamPerformancePodium({
  currentMemberId,
}: {
  currentMemberId?: string | null;
}) {
  const [top3, setTop3] = useState<MemberPerformance[]>([]);
  const [you, setYou] = useState<MemberPerformance | null>(null);
  const [scope, setScope] = useState<"global" | "assigned_team">("global");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/performance");
    const data = await res.json();
    if (res.ok) {
      const members = (data.members || []) as MemberPerformance[];
      setTop3(members.slice(0, 3));
      setScope(data.scope === "assigned_team" ? "assigned_team" : "global");
      const id = currentMemberId || data.currentMemberId;
      setYou(id ? members.find((m) => m.id === id) || null : null);
    }
    setLoading(false);
  }, [currentMemberId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="lux-skeleton h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (top3.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lux-violet/80">
            {scope === "assigned_team" ? "Your team only" : "Live leaderboard"}
          </p>
          <h2 className="font-bricolage font-extrabold text-lg text-lux-text mt-0.5">
            {scope === "assigned_team" ? "Top performers on your team" : "Top performers this week"}
          </h2>
        </div>
        <Link
          href="/team/performance"
          className="text-xs font-bold text-lux-cyan hover:underline"
        >
          {scope === "assigned_team" ? "Your team board →" : "Full team board →"}
        </Link>
      </div>

      {you && (
        <div className="lux-card-elite border-lux-cyan/25 bg-lux-cyan/[0.05] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-lux-muted">
            Your rank{" "}
            <strong className="text-lux-text font-bricolage">#{you.rank}</strong>
            {" · "}
            Score <strong className="text-lux-cyan tabular-nums">{you.productivityScore}</strong>
          </span>
          <span className="text-[0.72rem] text-lux-muted tabular-nums">
            🏆 {you.dealsClosed} deals · ✦ {you.referralsJoined} referral SDRs
          </span>
        </div>
      )}

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
            <div className="relative inline-flex justify-center mb-2">
              <TeamAvatar name={m.name} photoUrl={m.photoUrl} size="lg" />
              <span className="absolute -bottom-1 -right-1 text-lg drop-shadow" aria-hidden>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
              </span>
            </div>
            <div className="font-bricolage font-extrabold text-lux-text truncate">
              {m.name}
              {currentMemberId === m.id ? " (you)" : ""}
            </div>
            <div className="text-xs text-lux-muted mt-1">Score {m.productivityScore}</div>
            <div className="text-[0.65rem] text-lux-cyan mt-2 tabular-nums">
              {m.usedWeek} used · {m.leadsWeek} leads · 🏆 {m.dealsClosed} deals
            </div>
            {m.referralsJoined > 0 && (
              <div className="text-[0.65rem] text-amber-300 mt-1">
                ✦ {m.referralsJoined} referral SDRs
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
