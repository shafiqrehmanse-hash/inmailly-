"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminKey } from "@/lib/admin-context";
import { formatDurationMinutes } from "@/lib/utils";

type TimeRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  minutesToday: number;
  minutesWeek: number;
  live: boolean;
};

type ShiftRow = {
  member_id: string;
  member_name: string;
  status: string;
  sends_count: number | null;
  started_at: string | null;
  completed_at: string | null;
};

export default function AdminTeamHoursSection() {
  const adminKey = useAdminKey();
  const [rows, setRows] = useState<TimeRow[]>([]);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [timeRes, shiftRes] = await Promise.all([
      fetch(`/api/admin/team/time?key=${adminKey}`),
      fetch(`/api/admin/team/campaign-shifts?key=${adminKey}`),
    ]);
    const time = await timeRes.json();
    const shift = await shiftRes.json();
    setRows(time.members || []);
    setShifts(shift.shifts || []);
    setNeedsMigration(Boolean(time.needsMigration || shift.needsMigration));
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const shiftByMember = Object.fromEntries(shifts.map((s) => [s.member_id, s]));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Time &amp; daily campaign</h1>
        <p className="text-sm text-lux-muted mt-1">
          Logged-in minutes while the team workspace is open, plus today&apos;s start / done reports.
        </p>
      </div>

      {needsMigration && (
        <div className="lux-card p-4 border-amber-500/30 text-sm text-amber-200">
          Run migration <code className="text-amber-100">033_member_shifts_and_sessions.sql</code> in Supabase,
          then refresh.
        </div>
      )}

      {loading ? (
        <p className="text-lux-muted text-sm">Loading…</p>
      ) : (
        <div className="lux-card overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.06]">
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3">Today</th>
                <th className="text-left px-4 py-3">This week</th>
                <th className="text-left px-4 py-3">Campaign today</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = shiftByMember[r.id];
                return (
                  <tr key={r.id} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-lux-text flex items-center gap-2">
                        {r.name}
                        {r.live && (
                          <span className="text-[0.58rem] font-bold uppercase text-emerald-400">Live</span>
                        )}
                      </div>
                      <div className="text-[0.62rem] text-lux-muted">{r.email}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-lux-cyan">
                      {formatDurationMinutes(r.minutesToday)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-lux-muted">
                      {formatDurationMinutes(r.minutesWeek)}
                    </td>
                    <td className="px-4 py-3 text-lux-muted">
                      {!s ? (
                        "—"
                      ) : s.status === "done" ? (
                        <span className="text-emerald-300">
                          Done · {s.sends_count ?? 0} sends
                        </span>
                      ) : s.status === "started" ? (
                        <span className="text-amber-300">Started</span>
                      ) : (
                        s.status
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
