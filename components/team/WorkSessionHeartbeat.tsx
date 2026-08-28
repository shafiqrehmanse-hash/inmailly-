"use client";

import { useEffect, useState } from "react";
import { formatDurationMinutes } from "@/lib/utils";

export default function WorkSessionHeartbeat() {
  const [minutes, setMinutes] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function beat() {
      try {
        const res = await fetch("/api/team/session", { method: "POST" });
        const data = await res.json();
        if (!cancelled && typeof data.minutesToday === "number") {
          setMinutes(Math.round(data.minutesToday));
        }
      } catch {
        /* ignore */
      }
    }

    beat();
    const id = window.setInterval(beat, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (minutes == null) return null;

  return (
    <div className="mb-4 lux-card px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-xs text-lux-muted">Time on platform today</p>
      <p className="text-sm font-semibold text-lux-cyan tabular-nums">{formatDurationMinutes(minutes)}</p>
    </div>
  );
}
