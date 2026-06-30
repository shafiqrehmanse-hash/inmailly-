"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminHubShell from "@/components/admin/managed/AdminHubShell";
import AdminStatCard from "@/components/admin/AdminStatCard";
import Button from "@/components/ui/Button";
import { useAdminKey } from "@/lib/admin-context";

export default function AdminOverviewPage() {
  const adminKey = useAdminKey();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/overview?key=${adminKey}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load overview");
        setOverview(null);
      } else {
        setOverview(data);
      }
    } catch {
      setError("Network error loading overview");
      setOverview(null);
    }
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  const ov = overview as {
    members?: number;
    clients?: number;
    projects?: { total: number; active: number; preview: number; needs_setup: number };
    links?: { available: number; claimed: number; used: number };
    leads?: number;
    deals?: number;
    today?: { links: number; leads: number };
  } | null;

  return (
    <AdminHubShell onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Overview</h1>
          <p className="text-sm text-lux-muted mt-1">InMailly operations — open a managed area from the sidebar.</p>
        </div>

        {loading ? (
          <p className="text-lux-muted">Loading overview…</p>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminStatCard value={ov?.clients || 0} label="Clients" />
              <AdminStatCard value={ov?.projects?.total || 0} label="Projects" />
              <AdminStatCard value={ov?.members || 0} label="Team members" />
              <AdminStatCard value={ov?.leads || 0} label="Leads" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <AdminStatCard value={ov?.projects?.active || 0} label="Active campaigns" sub="projects" />
              <AdminStatCard value={ov?.projects?.preview || 0} label="Preview / draft" sub="projects" />
              <AdminStatCard value={ov?.deals || 0} label="Deals closed" />
              <AdminStatCard
                value={(ov?.links?.available || 0) + (ov?.links?.claimed || 0) + (ov?.links?.used || 0)}
                label="Total links"
              />
            </div>
            {(ov?.projects?.needs_setup || 0) > 0 && (
              <div className="lux-card p-5 border-amber-500/25 bg-amber-500/5">
                <h3 className="font-bricolage font-bold text-amber-300 mb-1">
                  {ov?.projects?.needs_setup} client{ov?.projects?.needs_setup === 1 ? "" : "s"} need setup
                </h3>
                <p className="text-sm text-lux-muted">
                  Self-signup accounts still in preview — assign a manager, add scripts, and activate.
                </p>
                <Link href="/admin/clients/setup">
                  <Button variant="lux-ghost" size="sm" className="mt-3">
                    Open client setup →
                  </Button>
                </Link>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <AdminStatCard value={ov?.links?.available || 0} label="Available" sub="links" />
              <AdminStatCard value={ov?.links?.claimed || 0} label="Claimed" sub="links" />
              <AdminStatCard value={ov?.links?.used || 0} label="Used" sub="links" />
            </div>
            <div className="lux-card p-5">
              <h3 className="font-bricolage font-bold text-lux-text mb-2">Today&apos;s activity</h3>
              <p className="text-sm text-lux-muted">
                {ov?.today?.links || 0} links imported · {ov?.today?.leads || 0} leads added
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { href: "/admin/clients", label: "Client panel", desc: "CRM, email, onboarding" },
                { href: "/admin/projects", label: "Projects panel", desc: "Campaigns & InMail packages" },
                { href: "/admin/team/links", label: "Team & links", desc: "Outreach pool & workers" },
                { href: "/admin/team/members", label: "Team members", desc: "Access & invites" },
              ].map((q) => (
                <Link
                  key={q.href}
                  href={q.href}
                  className="lux-card p-4 text-left hover:border-lux-cyan/30 transition-colors group"
                >
                  <div className="text-sm font-semibold text-lux-cyan group-hover:text-lux-text transition-colors">
                    {q.label} →
                  </div>
                  <p className="text-xs text-lux-muted mt-1">{q.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminHubShell>
  );
}
