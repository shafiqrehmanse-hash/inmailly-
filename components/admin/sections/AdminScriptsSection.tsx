"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function AdminScriptsSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [script, setScript] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/scripts?key=${adminKey}`);
    const data = await res.json();
    setScript(data.script || "");
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveScript() {
    await fetch(`/api/admin/scripts?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ script }),
    });
    showToast("Script saved — team sees it in their daily bar");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Daily scripts</h1>
        <p className="text-sm text-lux-muted mt-1">Add Note &amp; InMail templates for outreach workers.</p>
      </div>
      <div className="lux-card p-5 space-y-4">
        <textarea
          className="lux-input min-h-[240px]"
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Write today's outreach script template…"
        />
        <Button variant="lux" onClick={saveScript}>Save script</Button>
      </div>
    </div>
  );
}
