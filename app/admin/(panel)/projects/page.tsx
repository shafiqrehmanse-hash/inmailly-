"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminProjectsSection from "@/components/admin/AdminProjectsSection";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

function ProjectsInner() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") || undefined;
  const status = searchParams.get("status") || undefined;
  const packageFilter = searchParams.get("package") || undefined;
  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers((data.members || []).filter((m: TeamMember) => m.role === "campaign_manager"));
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  let title = "All projects";
  if (packageFilter) title = `${Number(packageFilter).toLocaleString()} InMail projects`;
  else if (status === "active") title = "Active campaigns";
  else if (status === "preview") title = "Preview & draft projects";
  else if (status === "draft") title = "Draft projects";

  return (
    <div className="max-w-6xl mx-auto">
      <AdminProjectsSection
        adminKey={adminKey}
        members={members}
        onToast={(message, type) => showToast(message, type)}
        initialClientFilter={clientId}
        initialStatusFilter={status}
        initialPackageFilter={packageFilter}
        pageTitle={title}
      />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsInner />
    </Suspense>
  );
}
