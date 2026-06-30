"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { useAdminKey } from "@/lib/admin-context";

export default function TeamOverviewPage() {
  const adminKey = useAdminKey();
  const [ov, setOv] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/overview?key=${adminKey}`);
    setOv(await res.json());
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const data = ov as {
    members?: number;
    leads?: number;
    links?: { available: number; claimed: number; used: number };
    deals?: number;
  } | null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team overview</h1>
        <p className="text-sm text-lux-muted mt-1">Outreach operations at a glance.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard value={data?.members || 0} label="Team members" />
        <AdminStatCard value={data?.leads || 0} label="Total leads" />
        <AdminStatCard value={data?.deals || 0} label="Deals closed" />
        <AdminStatCard value={data?.links?.available || 0} label="Links in pool" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { href: "/admin/team/links", label: "Work links", desc: "Import, assign, release" },
          { href: "/admin/team/leads", label: "All leads", desc: "Pipeline across team" },
          { href: "/admin/team/members", label: "Team members", desc: "Roles & invites" },
          { href: "/admin/team/scripts", label: "Daily scripts", desc: "Outreach templates" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="lux-card p-4 hover:border-lux-cyan/30 transition-colors">
            <div className="text-sm font-semibold text-lux-cyan">{q.label} →</div>
            <p className="text-xs text-lux-muted mt-1">{q.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
