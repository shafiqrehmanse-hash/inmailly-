"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { TrialContent } from "@/lib/site-content-defaults";

export default function AdminTrialToggle({
  adminKey,
  onToast,
}: {
  adminKey: string;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [trial, setTrial] = useState<TrialContent | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/site-content?key=${adminKey}`);
    const data = await res.json();
    setTrial((data.sections?.trial as TrialContent) || { enabled: false, inmailCount: 200, name: "Free trial", subtitle: "200 InMails · preview your dashboard" });
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(enabled: boolean) {
    if (!trial) return;
    setSaving(true);
    const next = { ...trial, enabled };
    const res = await fetch(`/api/admin/site-content?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ section: "trial", data: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      onToast(data.error, "error");
      return;
    }
    setTrial(next);
    onToast(enabled ? "Free trial is live on the website" : "Free trial hidden from website");
  }

  if (!trial) return null;

  return (
    <div className="lux-card p-5 sm:p-6 border-lux-cyan/20 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-lux-cyan mb-1">Website trial</p>
          <h3 className="font-bricolage font-bold text-lg text-lux-text">200 InMail free trial</h3>
          <p className="text-sm text-lux-muted mt-1 max-w-xl">
            One click — shows a <strong className="text-lux-text">Free trial</strong> card on pricing. New signups get a{" "}
            {trial.inmailCount.toLocaleString()} InMail preview project. Turn off and it disappears instantly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold uppercase tracking-wide ${trial.enabled ? "text-emerald-400" : "text-lux-muted"}`}>
            {trial.enabled ? "ON" : "OFF"}
          </span>
          <button
            type="button"
            disabled={saving}
            onClick={() => toggle(!trial.enabled)}
            className={`relative w-14 h-8 rounded-full border transition-colors ${
              trial.enabled ? "bg-emerald-500/30 border-emerald-500/50" : "bg-white/[0.06] border-white/[0.12]"
            }`}
            aria-pressed={trial.enabled}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${
                trial.enabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
      {trial.enabled && (
        <p className="text-xs text-emerald-400/90">
          Live — visitors see &quot;{trial.name}&quot; ({trial.inmailCount} InMails) on the homepage pricing section.
        </p>
      )}
      <Button variant="lux-ghost" size="sm" onClick={load} disabled={saving}>
        Refresh status
      </Button>
    </div>
  );
}
