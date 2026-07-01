"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useAdminKey } from "@/lib/admin-context";

export default function AdminWeeklyGoalCard() {
  const adminKey = useAdminKey();
  const [target, setTarget] = useState(40);
  const [current, setCurrent] = useState(0);
  const [weekStart, setWeekStart] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/team/goals?key=${adminKey}`);
    const data = await res.json();
    setTarget(data.targetLeads || 40);
    setCurrent(data.currentLeads || 0);
    setWeekStart(data.weekStart || "");
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    const res = await fetch(`/api/admin/team/goals?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ targetLeads: target }),
    });
    const data = await res.json();
    if (!data.error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
    }
  }

  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));

  return (
    <div className="lux-card-elite p-5 border-amber-500/20">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-amber-400 mb-3">Weekly team goal</p>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <span className="text-2xl font-bold text-lux-text tabular-nums">{current}</span>
          <span className="text-lux-muted"> / {target} leads ({pct}%)</span>
        </div>
        {weekStart && <span className="text-xs text-lux-muted">Week of {weekStart}</span>}
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-500 to-lux-cyan" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="lux-input w-28"
          type="number"
          min={1}
          value={target}
          onChange={(e) => setTarget(parseInt(e.target.value) || 40)}
        />
        <Button variant="lux-cyan" size="sm" onClick={save}>
          {saved ? "Saved!" : "Set target"}
        </Button>
      </div>
      <p className="text-[0.62rem] text-lux-muted mt-2">Visible to team leaders and in the morning email.</p>
    </div>
  );
}
