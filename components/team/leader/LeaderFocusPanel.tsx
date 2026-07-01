"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";

export default function LeaderFocusPanel() {
  const [message, setMessage] = useState("");
  const [days, setDays] = useState(7);
  const [active, setActive] = useState<{ message: string; expires_at: string } | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/team/leader/focus");
    const data = await res.json();
    setActive(data.focus || null);
    if (data.focus?.message) setMessage(data.focus.message);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function publish() {
    if (!message.trim()) {
      flash("Enter a message");
      return;
    }
    const res = await fetch("/api/team/leader/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, days }),
    });
    const data = await res.json();
    if (data.error) flash(data.error);
    else {
      flash("Focus banner published on team home");
      load();
    }
  }

  async function clearFocus() {
    await fetch("/api/team/leader/focus", { method: "DELETE" });
    setActive(null);
    flash("Banner removed");
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className="lux-toast-anchor" role="status">
          <div className="lux-toast-success text-center">{toast}</div>
        </div>
      )}

      <p className="text-sm text-lux-muted">
        Shows on everyone&apos;s home page — no email needed. Great for weekly priorities.
      </p>

      {active && (
        <div className="lux-card-elite p-4 border-amber-500/25 bg-amber-500/[0.06]">
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-amber-400 mb-2">Live banner</p>
          <p className="text-sm text-lux-text">{active.message}</p>
          <p className="text-[0.62rem] text-lux-muted mt-2">
            Expires {new Date(active.expires_at).toLocaleDateString()}
          </p>
          <Button variant="lux-soft" size="sm" className="mt-3" onClick={clearFocus}>
            Remove banner
          </Button>
        </div>
      )}

      <div className="lux-card-elite p-5 space-y-3">
        <textarea
          className="lux-input min-h-[100px]"
          placeholder="e.g. This week: prioritize SaaS founders, use Script B for InMails."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-lux-muted">Show for</label>
          <input
            className="lux-input w-20"
            type="number"
            min={1}
            max={14}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 7)}
          />
          <span className="text-sm text-lux-muted">days</span>
        </div>
        <Button variant="lux" className="w-full" onClick={publish}>
          Publish focus banner
        </Button>
      </div>
    </div>
  );
}
