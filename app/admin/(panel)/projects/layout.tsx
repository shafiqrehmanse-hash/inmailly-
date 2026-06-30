"use client";

import { Suspense } from "react";
import ManagedShell from "@/components/admin/managed/ManagedShell";
import { PROJECTS_ADMIN_NAV } from "@/lib/admin-managed-nav";

function ProjectsLayoutInner({ children }: { children: React.ReactNode }) {
  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <ManagedShell
      areaTitle="Projects"
      areaBadge="Managed"
      groups={PROJECTS_ADMIN_NAV}
      onLogout={handleLogout}
    >
      {children}
    </ManagedShell>
  );
}

export default function ProjectsAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ProjectsLayoutInner>{children}</ProjectsLayoutInner>
    </Suspense>
  );
}
