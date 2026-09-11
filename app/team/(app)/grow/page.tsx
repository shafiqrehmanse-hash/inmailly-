"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Toast, { type ToastType } from "@/components/team/Toast";
import { GROW_DAILY_USED_CAP } from "@/lib/grow-cap";

type Row = {
  id: string;
  status: "pending" | "used";
  first_name: string;
  last_name: string;
  profile_url: string;
  used_at: string | null;
};

export default function TeamGrowPage() {
  const [tab, setTab] = useState<"pending" | "used">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [usedToday, setUsedToday] = useState(0);
  const [remaining, setRemaining] = useState(GROW_DAILY_USED_CAP);
  const [cap, setCap] = useState(GROW_DAILY_USED_CAP);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/team/grow");
    const data = await res.json();
    setRows(data.assignments || []);
    setUsedToday(data.usedToday || 0);
    setRemaining(data.remainingToday ?? GROW_DAILY_USED_CAP);
    setCap(data.cap || GROW_DAILY_USED_CAP);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = rows.filter((r) => r.status === "pending");
  const used = rows.filter((r) => r.status === "used");
  const list = tab === "pending" ? pending : used;
  const atCap = remaining <= 0;

  async function markUsed(row: Row) {
    if (atCap) {
      setToast({
        message: `Daily cap of ${cap} reached. Come back tomorrow.`,
        type: "error",
      });
      return;
    }
    setBusyId(row.id);
    const res = await fetch("/api/team/grow", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: row.id }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setToast({ message: data.error || "Could not mark used", type: "error" });
      return;
    }
    setToast({ message: `Marked used · ${data.remainingToday} left today`, type: "success" });
    load();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lux-cyan mb-1">
          Grow our accounts
        </p>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Connection requests</h1>
        <p className="text-sm text-lux-muted mt-2 leading-relaxed">
          These are <strong className="text-lux-text">InMailly profiles</strong>. Open LinkedIn, send a
          connection request from your account, then mark used. Stop at{" "}
          <strong className="text-lux-cyan">{cap} per day</strong> so we stay under LinkedIn limits.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "text-lux-cyan" },
          { label: "Used today", value: usedToday, color: atCap ? "text-amber-400" : "text-emerald-400" },
          { label: "Left today", value: remaining, color: atCap ? "text-red-400" : "text-lux-text" },
        ].map((s) => (
          <div key={s.label} className="lux-card p-4 text-center">
            <div className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
            <div className="text-[0.58rem] uppercase tracking-wide text-lux-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {atCap && (
        <div className="lux-card-elite p-4 border-amber-500/30 text-sm text-amber-200">
          You hit the daily cap of {cap}. Remaining pending profiles will wait until tomorrow.
        </div>
      )}

      <div className="flex gap-2">
        {(
          [
            ["pending", `To connect (${pending.length})`],
            ["used", `Used (${used.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              tab === id
                ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
                : "text-lux-muted border-white/[0.08]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-lux-muted">Loading…</p>
      ) : list.length === 0 ? (
        <div className="lux-card p-8 text-center text-sm text-lux-muted">
          {tab === "pending"
            ? "No grow profiles waiting. Admin will send a flow when they need connections."
            : "You haven’t marked any grow profiles used yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((row) => (
            <article key={row.id} className="lux-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-lux-text">
                  {row.first_name} {row.last_name}
                </p>
                <p className="text-xs text-lux-muted truncate mt-0.5">{row.profile_url}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a href={row.profile_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="lux-ghost" size="sm">
                    Open profile
                  </Button>
                </a>
                {row.status === "pending" && (
                  <Button
                    variant="lux"
                    size="sm"
                    disabled={!!busyId || atCap}
                    onClick={() => markUsed(row)}
                  >
                    {busyId === row.id ? "Saving…" : "Mark used"}
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
