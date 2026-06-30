"use client";

import { useRouter } from "next/navigation";
import AdminClientsSection from "@/components/admin/AdminClientsSection";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function ClientsEmailPage() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Send email</h1>
        <p className="text-sm text-lux-muted mt-1">
          Select a client and send campaign started, finished, or custom messages.
        </p>
      </div>
      <AdminClientsSection
        adminKey={adminKey}
        emailFocus
        onToast={(message, type) => showToast(message, type)}
        onOpenProjects={(clientId) => router.push(`/admin/projects?clientId=${clientId}`)}
      />
    </div>
  );
}
