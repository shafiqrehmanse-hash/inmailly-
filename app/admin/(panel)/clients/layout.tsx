"use client";

import { Suspense } from "react";
import ManagedShell from "@/components/admin/managed/ManagedShell";
import { CLIENTS_ADMIN_NAV } from "@/lib/admin-managed-nav";

function ClientsLayoutInner({ children }: { children: React.ReactNode }) {
  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <ManagedShell
      areaTitle="Clients"
      areaBadge="Managed"
      groups={CLIENTS_ADMIN_NAV}
      onLogout={handleLogout}
    >
      {children}
    </ManagedShell>
  );
}

export default function ClientsAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ClientsLayoutInner>{children}</ClientsLayoutInner>
    </Suspense>
  );
}
