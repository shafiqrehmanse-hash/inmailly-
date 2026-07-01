"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import ManagedShell from "@/components/admin/managed/ManagedShell";
import { CLIENTS_ADMIN_NAV } from "@/lib/admin-managed-nav";
import { useAdminKey } from "@/lib/admin-context";

function ClientsLayoutInner({ children }: { children: React.ReactNode }) {
  const adminKey = useAdminKey();
  const [needsSetup, setNeedsSetup] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/overview?key=${adminKey}`);
    const data = await res.json();
    if (res.ok) setNeedsSetup(data.projects?.needs_setup || 0);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(
    () =>
      CLIENTS_ADMIN_NAV.map((group) => ({
        ...group,
        items: group.items.map((item) =>
          item.href === "/admin/clients/setup" ? { ...item, critical: needsSetup > 0 } : item
        ),
      })),
    [needsSetup]
  );

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <ManagedShell
      areaTitle="Clients"
      areaBadge="Managed"
      groups={groups}
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
