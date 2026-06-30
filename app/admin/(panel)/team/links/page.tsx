"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminLinksSection from "@/components/admin/AdminLinksSection";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

function TeamLinksInner() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const searchParams = useSearchParams();
  const memberId = searchParams.get("memberId") || undefined;
  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers(data.members || []);
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Work links</h1>
        <p className="text-sm text-lux-muted mt-1">Import LinkedIn profiles and assign to outreach workers.</p>
      </div>
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
