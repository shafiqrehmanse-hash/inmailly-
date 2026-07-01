"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { MemberPerformance, TeamPerformanceData } from "@/lib/team-performance";
import { cn, formatRelative } from "@/lib/utils";
import type { NudgeTemplateKey } from "@/lib/leader-nudges";

export default function LeaderTeamPulse() {
  const [data, setData] = useState<TeamPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/leader/performance");
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function nudge(member: MemberPerformance, template: NudgeTemplateKey) {
    setBusyId(member.id + template);
    const res = await fetch("/api/team/leader/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id, template }),
    });
    const json = await res.json();
    if (json.error) flash(json.error);
    else flash(json.skipped ? "Email skipped (not configured)" : `Reminder sent to ${member.name}`);
    setBusyId(null);
  }

  async function releaseStale(member: MemberPerformance) {
    if (!confirm(`Release stale links (48h+) back to the pool for ${member.name}?`)) return;
    setBusyId(member.id + "release");
    const res = await fetch("/api/team/leader/release-stale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id }),
    });
    const json = await res.json();
    if (json.error) flash(json.error);
    else {
      flash(`Released ${json.released} link(s) for ${json.memberName}`);
      load();
    }
    setBusyId(null);
  }

  const workers = (data?.members || []).filter((m) => m.role !== "team_leader");

  return (
    <div className="space-y-5">
      {toast && (
        <div className="lux-toast-anchor" role="status">
          <div className="lux-toast-success text-center">{toast}</div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-lux-muted">Live team activity — nudge individuals or release stale links.</p>
        <Button variant="lux-soft" size="sm" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Pool available", value: data.totals.poolAvailable },
            { label: "Used today", value: data.totals.usedToday },
            { label: "Leads today", value: data.totals.leadsToday },
            { label: "Need attention", value: data.totals.needsAttention, warn: true },
          ].map((s) => (
            <div key={s.label} className="lux-card-elite p-3 text-center">
              <div className={cn("text-xl font-bold tabular-nums", s.warn && s.value > 0 ? "text-amber-400" : "text-lux-cyan")}>
                {s.value}
              </div>
              <div className="text-[0.62rem] uppercase tracking-wide text-lux-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="lux-card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.06]">
              <th className="text-left px-4 py-3">Member</th>
              <th className="text-left px-4 py-3">Today</th>
              <th className="text-left px-4 py-3">Week</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-lux-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && workers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-lux-muted">
                  No outreach workers yet.
                </td>
              </tr>
            )}
            {workers.map((m) => (
              <tr key={m.id} className="border-b border-white/[0.06] last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-lux-text">{m.name}</div>
                  <div className="text-[0.62rem] text-lux-muted">#{m.rank} · {m.claimed} claimed</div>
                </td>
                <td className="px-4 py-3 tabular-nums text-lux-muted">
                  {m.usedToday} used · {m.leadsToday} leads
                </td>
                <td className="px-4 py-3 tabular-nums text-lux-muted">
                  {m.usedWeek} used · {m.leadsWeek} leads
                </td>
                <td className="px-4 py-3">
                  {m.needsAttention ? (
                    <span className="text-[0.62rem] font-bold uppercase text-amber-400">
                      {m.inactive24h ? "Inactive" : m.staleClaimed > 0 ? `${m.staleClaimed} stale` : "Low output"}
                    </span>
                  ) : (
                    <span className="text-[0.62rem] text-emerald-400/80">On track</span>
                  )}
                  {m.lastLogin && (
                    <div className="text-[0.58rem] text-lux-muted">{formatRelative(m.lastLogin)}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    {m.staleClaimed > 0 && (
                      <>
                        <button
                          type="button"
                          disabled={!!busyId}
                          onClick={() => nudge(m, "stale_links")}
                          className="text-[0.62rem] px-2 py-1 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                        >
                          Nudge
                        </button>
                        <button
                          type="button"
                          disabled={!!busyId}
                          onClick={() => releaseStale(m)}
                          className="text-[0.62rem] px-2 py-1 rounded-lg border border-lux-cyan/30 text-lux-cyan hover:bg-lux-cyan/10"
                        >
                          Release
                        </button>
                      </>
                    )}
                    {m.inactive24h && (
                      <button
                        type="button"
                        disabled={!!busyId}
                        onClick={() => nudge(m, "inactive")}
                        className="text-[0.62rem] px-2 py-1 rounded-lg border border-lux-violet/30 text-lux-violet hover:bg-lux-violet/10"
                      >
                        Check in
                      </button>
                    )}
                    {!m.inactive24h && m.staleClaimed === 0 && data && data.totals.poolAvailable > 0 && (
                      <button
                        type="button"
                        disabled={!!busyId}
                        onClick={() => nudge(m, "pool_available")}
                        className="text-[0.62rem] px-2 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white"
                      >
                        Pool ping
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
