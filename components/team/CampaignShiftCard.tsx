"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";

type Shift = {
  status: "idle" | "started" | "done";
  started_at: string | null;
  completed_at: string | null;
  sends_count: number | null;
};

export default function CampaignShiftCard() {
  const [shift, setShift] = useState<Shift | null>(null);
  const [sends, setSends] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/team/campaign-shift");
    const data = await res.json();
    setShift(data.shift || null);
    if (data.shift?.sends_count != null) setSends(String(data.shift.sends_count));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function start() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/team/campaign-shift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not start");
      return;
    }
    setShift(data.shift);
    setToast("Campaign started — good luck today.");
    setTimeout(() => setToast(""), 2500);
  }

  async function complete() {
    const n = parseInt(sends, 10);
    if (!Number.isFinite(n) || n < 0) {
      setError("Enter how many InMails you sent today (e.g. 40, 50, 60).");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/team/campaign-shift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", sends_count: n }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not mark done");
      return;
    }
    setShift(data.shift);
    setToast("Logged. Thank you — see you tomorrow.");
    setTimeout(() => setToast(""), 2500);
  }

  const status = shift?.status || "idle";

  return (
    <div className="lux-card-elite p-5 border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.07] via-transparent to-transparent space-y-4">
      <div>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-emerald-300 mb-1">
          Today&apos;s campaign
        </p>
        <h2 className="font-bricolage font-extrabold text-lg text-lux-text">Start, then mark done</h2>
        <p className="text-sm text-lux-muted mt-1 leading-relaxed">
          Press <strong className="text-lux-text">Campaign started</strong> when you begin. At the end of the day,
          mark done and enter how many InMails you sent (40, 50, 60…).
        </p>
      </div>

      {toast && <p className="text-sm text-emerald-300 font-semibold">{toast}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {status === "idle" && (
        <Button variant="lux" disabled={busy} onClick={start}>
          {busy ? "Starting…" : "Campaign started →"}
        </Button>
      )}

      {status === "started" && (
        <div className="space-y-3">
          <p className="text-xs text-emerald-200/80">
            Campaign is running
            {shift?.started_at ? ` · started ${new Date(shift.started_at).toLocaleTimeString()}` : ""}.
          </p>
          <label className="block text-[0.65rem] font-semibold uppercase tracking-wide text-lux-muted">
            Total InMails sent today
          </label>
          <input
            className="lux-input w-full max-w-[160px]"
            type="number"
            min={0}
            max={5000}
            placeholder="e.g. 50"
            value={sends}
            onChange={(e) => setSends(e.target.value)}
          />
          <Button variant="lux-cyan" disabled={busy} onClick={complete}>
            {busy ? "Saving…" : "Mark campaign done →"}
          </Button>
        </div>
      )}

      {status === "done" && (
        <p className="text-sm text-emerald-200">
          Done for today — <strong className="text-lux-text">{shift?.sends_count ?? 0}</strong> InMails logged.
        </p>
      )}
    </div>
  );
}
