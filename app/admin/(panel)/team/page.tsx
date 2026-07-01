"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { useAdminKey } from "@/lib/admin-context";

type TeamOverview = {
  members?: number;
  leads?: number;
  leadsToday?: number;
  leadsWeek?: number;
  dealsClosed?: number;
  totalFunds?: number;
  links?: { available: number; claimed: number; used: number; usedToday: number; total: number };
  memberPills?: { id: string; name: string; claimed: number; used: number }[];
};

export default function TeamOverviewPage() {
  const adminKey = useAdminKey();
  const [data, setData] = useState<TeamOverview | null>(null);
  const [autoToday, setAutoToday] = useState(0);

  const load = useCallback(async () => {
    const [ovRes, autoRes] = await Promise.all([
      fetch(`/api/admin/team/overview?key=${adminKey}`),
      fetch(`/api/admin/team/auto-assign?key=${adminKey}`),
    ]);
    setData(await ovRes.json());
    const auto = await autoRes.json();
    setAutoToday(auto.linksToday || 0);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team overview</h1>
        <p className="text-sm text-lux-muted mt-1">Outreach operations — marketing leads only, not client campaigns.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard value={data?.members || 0} label="Active members" />
        <AdminStatCard value={data?.leads || 0} label="Outreach leads" />
        <AdminStatCard value={data?.leadsToday || 0} label="Leads today" />
        <AdminStatCard value={data?.dealsClosed || 0} label="Deals closed" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard value={data?.leadsWeek || 0} label="Leads this week" />
        <AdminStatCard value={data?.links?.available || 0} label="Links in pool" />
        <AdminStatCard value={data?.links?.claimed || 0} label="Links claimed" />
        <AdminStatCard value={autoToday} label="Auto-assigned today" />
      </div>

      {autoToday > 0 && (
        <div className="lux-card-elite p-4 border-lux-violet/20 text-sm text-lux-muted">
          <strong className="text-lux-violet">{autoToday} links</strong> self-assigned by team members today — see{" "}
          <Link href="/admin/team/performance" className="text-lux-cyan font-semibold hover:underline">
            Team performance
          </Link>{" "}
          for details.
        </div>
      )}

      {data?.totalFunds !== undefined && data.totalFunds > 0 && (
        <div className="lux-card p-4 flex items-center justify-between">
          <span className="text-sm text-lux-muted">Total funds distributed</span>
          <span className="font-bricolage font-bold text-emerald-400">{data.totalFunds.toLocaleString()} PKR</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { href: "/admin/team/performance", label: "Team performance", desc: "Leaderboard & activity" },
          { href: "/admin/team/links", label: "Work links", desc: "Import, assign, release" },
          { href: "/admin/team/leads", label: "Outreach leads", desc: "Your marketing pipeline" },
          { href: "/admin/team/responses", label: "Responses", desc: "Reply on behalf of team" },
          { href: "/admin/team/live-chat", label: "Live chat", desc: "Assign leaders & monitor chats" },
          { href: "/admin/team/members", label: "Team members", desc: "Roles & invites" },
          { href: "/admin/team/offer-letter", label: "Offer letters", desc: "PDF offers — salary & commission" },
          { href: "/admin/team/email", label: "Email team", desc: "Broadcast with signature" },
          { href: "/admin/team/scripts", label: "Daily scripts", desc: "Add Note & InMail templates" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="lux-card p-4 hover:border-lux-cyan/30 transition-colors">
            <div className="text-sm font-semibold text-lux-cyan">{q.label} →</div>
            <p className="text-xs text-lux-muted mt-1">{q.desc}</p>
          </Link>
        ))}
      </div>

      <div className="lux-card p-4">
        <p className="text-xs uppercase tracking-wide text-lux-muted mb-3">Client campaigns</p>
        <p className="text-sm text-lux-muted mb-3">
          Campaign manager leads and responses live under Projects — not here.
        </p>
        <Link href="/admin/projects/responses" className="text-sm font-semibold text-lux-cyan hover:underline">
          Open campaign responses →
        </Link>
      </div>
    </div>
  );
}
