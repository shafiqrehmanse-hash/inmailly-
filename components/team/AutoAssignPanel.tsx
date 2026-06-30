"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { LINK_AUTO_ASSIGN } from "@/lib/link-auto-assign";
import { cn } from "@/lib/utils";

type AutoAssignStatus = {
  activeCount: number;
  poolCount: number;
  batchSize: number;
  maxActiveBeforeBlock: number;
  canAutoAssign: boolean;
  blocked: boolean;
  blockMessage: string | null;
  wouldAssign: number;
};

export default function AutoAssignPanel({
  onAssigned,
  onToast,
}: {
  onAssigned: () => void;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [status, setStatus] = useState<AutoAssignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/links/auto-assign");
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAutoAssign() {
    setAssigning(true);
    const res = await fetch("/api/team/links/auto-assign", { method: "POST" });
    const data = await res.json();
    setAssigning(false);

    if (!res.ok) {
      onToast(data.error || "Could not auto-assign", "error");
      load();
      return;
    }

    onToast(data.message, "success");
    load();
    onAssigned();
  }

  if (loading && !status) {
    return <div className="lux-skeleton h-28 rounded-2xl" />;
  }

  if (!status) return null;

  return (
    <div
      className={cn(
        "lux-card-featured p-5 sm:p-6 space-y-4",
        status.blocked && "border-amber-500/25"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lux-cyan mb-1">
            Auto-assign from pool
          </p>
          <h2 className="font-bricolage font-extrabold text-lg text-lux-text">
            Get up to {LINK_AUTO_ASSIGN.batchSize} links instantly
          </h2>
          <p className="text-sm text-lux-muted mt-1 max-w-lg leading-relaxed">
            One click assigns links from the shared pool — no admin needed. You must have fewer than{" "}
            {LINK_AUTO_ASSIGN.maxActiveBeforeBlock} active links, then mark each{" "}
            <strong className="text-lux-text">Used</strong> when outreach is done.
          </p>
        </div>
        <div className="text-right text-sm tabular-nums">
          <div className="text-lux-muted">
            Your active:{" "}
            <span className={cn("font-bold", status.blocked ? "text-amber-300" : "text-lux-cyan")}>
              {status.activeCount}
            </span>
          </div>
          <div className="text-lux-muted mt-0.5">
            Pool: <span className="font-bold text-red-400">{status.poolCount}</span>
          </div>
        </div>
      </div>

      {status.blocked ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90">
          {status.blockMessage}
        </div>
      ) : status.poolCount === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-lux-muted">
          Pool is empty — check back when admin adds more links.
        </div>
      ) : (
        <p className="text-xs text-lux-muted">
          Ready to assign <strong className="text-lux-cyan">{status.wouldAssign}</strong> link
          {status.wouldAssign === 1 ? "" : "s"} to your queue.
        </p>
      )}

      <Button
        variant="lux-cyan"
        size="md"
        disabled={!status.canAutoAssign || assigning}
        onClick={handleAutoAssign}
        className="w-full sm:w-auto"
      >
        {assigning ? "Assigning…" : "Auto assign me"}
      </Button>
    </div>
  );
}
