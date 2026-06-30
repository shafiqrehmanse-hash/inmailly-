"use client";

import { useRouter } from "next/navigation";
import AdminClientsSection from "@/components/admin/AdminClientsSection";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function ClientsPage() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto">
      <AdminClientsSection
        adminKey={adminKey}
        onToast={(message, type) => showToast(message, type)}
        onOpenProjects={(clientId) => router.push(`/admin/projects?clientId=${clientId}`)}
      />
    </div>
  );
}
