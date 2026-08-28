"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import TeamAvatar from "@/components/team/TeamAvatar";
import { useAdminKey } from "@/lib/admin-context";
import type { LeaderDashboard, LeaderWorkerRow } from "@/lib/team-leader-admin";
import { formatDate, formatRelative } from "@/lib/utils";

function salesNavLabel(status: LeaderWorkerRow["salesNav"]) {
  if (status === "activated") return "Activated";
  if (status === "activation_sent") return "Key sent";
  if (status === "pending") return "Requested";
  if (status === "error") return "Error";
  return "None";
}

function salesNavClass(status: LeaderWorkerRow["salesNav"]) {
  if (status === "activated") return "text-emerald-300 bg-emerald-500/15 border-emerald-500/30";
  if (status === "activation_sent" || status === "pending")
    return "text-amber-200 bg-amber-500/15 border-amber-500/30";
  if (status === "error") return "text-red-300 bg-red-500/15 border-red-500/30";
  return "text-lux-muted bg-white/[0.04] border-white/[0.08]";
}

export default function AdminTeamLeadersSection() {
  const adminKey = useAdminKey();
  const [leaders, setLeaders] = useState<LeaderDashboard[]>([]);
  const [unassigned, setUnassigned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/team/leaders?key=${adminKey}`);
    const data = await res.json();
    const list = (data.leaders || []) as LeaderDashboard[];
    setLeaders(list);
    setUnassigned(data.unassignedWorkers || 0);
    setOpenId((prev) => prev || list[0]?.id || null);
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const companyLeads = leaders.reduce((n, l) => n + l.totals.leads, 0);
  const companyDeals = leaders.reduce((n, l) => n + l.totals.deals, 0);
  const companyWorkers = leaders.reduce((n, l) => n + l.totals.workers, 0);
  const companySalesNav = leaders.reduce((n, l) => n + l.totals.salesNavActivated, 0);

  return (
    <div className="w-full max-w-none space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team leaders</h1>
        <p className="text-sm text-lux-muted mt-1">
          Anyone with the team leader role lands here with their assigned people, signups, Sales Navigator, and deals.
          Promote or assign people on{" "}
          <Link href="/admin/team/members" className="text-lux-cyan font-semibold hover:underline">
            Team members
          </Link>
          .
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard value={leaders.length} label="Team leaders" />
        <AdminStatCard value={companyWorkers} label="People under leaders" />
        <AdminStatCard value={companyDeals} label="Deals (their teams)" sub={`${companyLeads} leads`} />
        <AdminStatCard value={companySalesNav} label="Sales Nav activated" />
      </div>

      {unassigned > 0 && (
        <div className="lux-card-elite p-4 text-sm text-lux-muted border-amber-500/20">
          {unassigned} outreach {unassigned === 1 ? "person is" : "people are"} not assigned to a leader. Assign them on{" "}
          <Link href="/admin/team/members" className="text-lux-cyan font-semibold hover:underline">
            Team members
          </Link>
          .
        </div>
      )}

      {loading ? (
        <div className="lux-card px-4 py-12 text-center text-lux-muted">Loading leader teams…</div>
      ) : leaders.length === 0 ? (
        <div className="lux-card px-4 py-12 text-center text-lux-muted">
          No team leaders yet. Set someone&apos;s role to Team leader on Team members.
        </div>
      ) : (
        <div className="space-y-4">
          {leaders.map((leader) => {
            const open = openId === leader.id;
            const t = leader.totals;
            return (
              <article key={leader.id} className="lux-card border border-white/[0.06] overflow-hidden">
                <button
                  type="button"
                  className="w-full text-left p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                  onClick={() => setOpenId(open ? null : leader.id)}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <TeamAvatar name={leader.name} photoUrl={leader.photo_url} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bricolage font-bold text-lg text-lux-text">{leader.name}</h2>
                        {!leader.is_active && (
                          <span className="text-[0.58rem] font-bold uppercase tracking-wider text-red-300 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-md">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-lux-muted truncate">{leader.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full lg:w-auto lg:min-w-[32rem]">
                    {[
                      { label: "People", value: t.workers },
                      { label: "Signups", value: t.signupsViaInvite },
                      { label: "30d new", value: t.signupsLast30d },
                      { label: "Sales Nav", value: t.salesNavActivated },
                      { label: "Leads", value: t.leads },
                      { label: "Deals", value: t.deals },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg border border-white/[0.06] bg-black/20 px-2 py-2 text-center">
                        <div className="text-lg font-bold tabular-nums text-lux-cyan">{s.value}</div>
                        <div className="text-[0.55rem] uppercase tracking-wide text-lux-muted">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </button>

                {open && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                    <div className="flex flex-wrap gap-3 text-xs text-lux-muted">
                      <span>
                        Active: <strong className="text-lux-text">{t.activeWorkers}</strong>
                      </span>
                      <span>
                        Responses: <strong className="text-lux-text">{t.responses}</strong>
                      </span>
                      <span>
                        Links used: <strong className="text-lux-text">{t.used}</strong>
                      </span>
                      <span>
                        Referrals joined: <strong className="text-lux-text">{t.referrals}</strong>
                      </span>
                      <span>
                        Deal rate: <strong className="text-lux-text">{t.conversionPct}%</strong>
                      </span>
                      {t.salesNavPending > 0 && (
                        <span>
                          Sales Nav pending: <strong className="text-amber-200">{t.salesNavPending}</strong>
                        </span>
                      )}
                    </div>

                    {leader.inviteCodes.length > 0 && (
                      <p className="text-xs text-lux-muted">
                        Invite keys:{" "}
                        {leader.inviteCodes.map((c) => (
                          <span key={c.code} className="font-mono text-amber-200/90 mr-2">
                            {c.code}
                            {c.label ? ` (${c.label})` : ""}
                          </span>
                        ))}
                      </p>
                    )}

                    {leader.workers.length === 0 ? (
                      <p className="text-sm text-lux-muted py-4">
                        No one is assigned to this leader yet. Set Team leader on a worker in Team members.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[720px]">
                          <thead>
                            <tr className="text-[0.62rem] uppercase tracking-wide text-lux-muted text-left">
                              <th className="pb-2 pr-3 font-semibold">Person</th>
                              <th className="pb-2 pr-3 font-semibold">Leads</th>
                              <th className="pb-2 pr-3 font-semibold">Deals</th>
                              <th className="pb-2 pr-3 font-semibold">Rate</th>
                              <th className="pb-2 pr-3 font-semibold">Replies</th>
                              <th className="pb-2 pr-3 font-semibold">Used</th>
                              <th className="pb-2 pr-3 font-semibold">Referrals</th>
                              <th className="pb-2 pr-3 font-semibold">Sales Nav</th>
                              <th className="pb-2 font-semibold">Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leader.workers.map((w) => (
                              <tr key={w.id} className="border-t border-white/[0.05]">
                                <td className="py-2.5 pr-3">
                                  <p className="font-semibold text-lux-text">{w.name}</p>
                                  <p className="text-xs text-lux-muted">{w.email}</p>
                                  {!w.is_active && (
                                    <span className="text-[0.58rem] uppercase text-red-300">Inactive</span>
                                  )}
                                </td>
                                <td className="py-2.5 pr-3 tabular-nums">{w.leads}</td>
                                <td className="py-2.5 pr-3 tabular-nums text-emerald-400">{w.deals}</td>
                                <td className="py-2.5 pr-3 tabular-nums">{w.conversionPct}%</td>
                                <td className="py-2.5 pr-3 tabular-nums">{w.responses}</td>
                                <td className="py-2.5 pr-3 tabular-nums">{w.used}</td>
                                <td className="py-2.5 pr-3 tabular-nums">{w.referrals}</td>
                                <td className="py-2.5 pr-3">
                                  <span
                                    className={`text-[0.58rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${salesNavClass(w.salesNav)}`}
                                  >
                                    {salesNavLabel(w.salesNav)}
                                  </span>
                                </td>
                                <td className="py-2.5 text-xs text-lux-muted whitespace-nowrap">
                                  {formatDate(w.joined_at)}
                                  {w.last_login ? (
                                    <span className="block">Login {formatRelative(w.last_login)}</span>
                                  ) : null}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
