"use client";

import AdminHubShell from "@/components/admin/managed/AdminHubShell";
import AdminWebsiteSection from "@/components/admin/AdminWebsiteSection";
import AdminTrialToggle from "@/components/admin/AdminTrialToggle";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function AdminWebsitePage() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <AdminHubShell onLogout={handleLogout}>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Website CMS</h1>
          <p className="text-sm text-lux-muted mt-1">Homepage content and trial offer.</p>
        </div>
        <AdminTrialToggle adminKey={adminKey} onToast={(m, t) => showToast(m, t)} />
        <AdminWebsiteSection adminKey={adminKey} onToast={(m, t) => showToast(m, t)} />
      </div>
    </AdminHubShell>
  );
}
