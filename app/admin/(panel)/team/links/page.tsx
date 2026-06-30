"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminLinksSection from "@/components/admin/AdminLinksSection";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

type LinkStats = {
  links?: { available: number; claimed: number; used: number; usedToday: number; total: number };
  memberPills?: { id: string; name: string; claimed: number; used: number }[];
};

function TeamLinksInner() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId") || undefined;
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<LinkStats | null>(null);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers(data.members || []);
  }, [adminKey]);

  const loadStats = useCallback(async () => {
    const res = await fetch(`/api/admin/team/overview?key=${adminKey}`);
    setStats(await res.json());
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
    loadStats();
  }, [loadMembers, loadStats]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Work links</h1>
        <p className="text-sm text-lux-muted mt-1">Import LinkedIn profiles and assign to outreach workers.</p>
      </div>

      {stats?.links && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "Total", value: stats.links.total },
            { label: "Available", value: stats.links.available },
            { label: "Claimed", value: stats.links.claimed },
            { label: "Used", value: stats.links.used },
            { label: "Used today", value: stats.links.usedToday },
          ].map((s) => (
            <div key={s.label} className="lux-card p-3 text-center">
              <div className="font-bricolage font-bold text-lg text-lux-text">{s.value}</div>
              <div className="text-[0.65rem] uppercase tracking-wide text-lux-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {stats?.memberPills && stats.memberPills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.memberPills.map((m) => (
            <span
              key={m.id}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/[0.08] text-lux-muted"
            >
              {m.name}: <span className="text-lux-cyan">{m.claimed} claimed</span> · {m.used} used
            </span>
          ))}
        </div>
      )}

      <AdminLinksSection
        adminKey={adminKey}
        members={members}
        onToast={(message, type) => showToast(message, type)}
        initialMemberFilter={memberId}
      />
    </div>
  );
}

export default function TeamLinksPage() {
  return (
    <Suspense>
      <TeamLinksInner />
    </Suspense>
  );
}
