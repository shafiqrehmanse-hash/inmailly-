"use client";

import { useRouter } from "next/navigation";
import AdminClientsSection from "@/components/admin/AdminClientsSection";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function ClientsSetupPage() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Needs setup</h1>
        <p className="text-sm text-lux-muted mt-1">
          Self-signup clients still in preview — assign a manager, add scripts, set package, and activate.
        </p>
      </div>
      <AdminClientsSection
        adminKey={adminKey}
        setupOnly
        onToast={(message, type) => showToast(message, type)}
        onOpenProjects={(clientId) => router.push(`/admin/projects?clientId=${clientId}`)}
      />
    </div>
  );
}
