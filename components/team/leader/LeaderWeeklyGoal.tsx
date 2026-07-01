"use client";

import { useCallback, useEffect, useState } from "react";

type GoalData = {
  weekStart: string;
  targetLeads: number;
  currentLeads: number;
  pct: number;
};

export default function LeaderWeeklyGoal() {
  const [goal, setGoal] = useState<GoalData | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/team/leader/goals");
    setGoal(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!goal) return null;

  return (
    <div className="lux-card-elite p-5 border-amber-500/20">
      <p className="text-[0.62rem] font-bold uppercase tracking-widest text-amber-400 mb-2">Weekly team goal</p>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div>
          <span className="text-3xl font-bricolage font-extrabold text-lux-text tabular-nums">{goal.currentLeads}</span>
          <span className="text-lux-muted text-lg"> / {goal.targetLeads} leads</span>
        </div>
        <span className="text-sm font-bold text-amber-400">{goal.pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-lux-cyan transition-all"
          style={{ width: `${goal.pct}%` }}
        />
      </div>
      <p className="text-[0.62rem] text-lux-muted mt-2">Week starting {goal.weekStart} · Admin sets the target</p>
    </div>
  );
}
