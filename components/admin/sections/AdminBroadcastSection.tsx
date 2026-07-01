"use client";

import TeamBroadcastComposer from "@/components/team/TeamBroadcastComposer";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function AdminBroadcastSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Email team</h1>
        <p className="text-sm text-lux-muted mt-1">
          Send a custom message to all or selected members — dark HTML with your founder signature.
        </p>
      </div>
      <TeamBroadcastComposer
        mode="admin"
        adminKey={adminKey}
        onNotify={(msg, type) => showToast(msg, type === "error" ? "error" : undefined)}
      />
    </div>
  );
}
