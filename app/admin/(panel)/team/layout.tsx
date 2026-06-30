"use client";

import { Suspense } from "react";
import ManagedShell from "@/components/admin/managed/ManagedShell";
import { TEAM_ADMIN_NAV } from "@/lib/admin-managed-nav";

function TeamLayoutInner({ children }: { children: React.ReactNode }) {
  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <ManagedShell
      areaTitle="Team Admin"
      areaBadge="Managed"
      groups={TEAM_ADMIN_NAV}
      onLogout={handleLogout}
    >
      {children}
    </ManagedShell>
  );
}

export default function TeamAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <TeamLayoutInner>{children}</TeamLayoutInner>
    </Suspense>
  );
}
