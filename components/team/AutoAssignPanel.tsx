"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { LINK_AUTO_ASSIGN, LINK_INTELLIGENCE_ASSIGN } from "@/lib/link-auto-assign";
import { cn } from "@/lib/utils";

type AssignStatus = {
  mode: "usual" | "intelligence";
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
  const [usual, setUsual] = useState<AssignStatus | null>(null);
  const [intel, setIntel] = useState<AssignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<"usual" | "intelligence" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [uRes, iRes] = await Promise.all([
      fetch("/api/team/links/auto-assign?mode=usual"),
      fetch("/api/team/links/auto-assign?mode=intelligence"),
    ]);
    if (uRes.ok) setUsual(await uRes.json());
    if (iRes.ok) setIntel(await iRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign(mode: "usual" | "intelligence") {
    setAssigning(mode);
    const res = await fetch("/api/team/links/auto-assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    const data = await res.json();
    setAssigning(null);

    if (!res.ok) {
      onToast(data.error || "Could not assign links", "error");
      load();
      return;
    }

    onToast(data.message, "success");
    load();
    onAssigned();
  }

  if (loading && !usual && !intel) {
    return <div className="lux-skeleton h-36 rounded-2xl" />;
  }

  return (
    <div className="lux-card-featured p-5 sm:p-6 space-y-5">
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lux-cyan mb-1">
          Get links from pool
        </p>
        <h2 className="font-bricolage font-extrabold text-lg text-lux-text">
          Choose Usual or Intelligence
        </h2>
        <p className="text-sm text-lux-muted mt-1 max-w-2xl leading-relaxed">
          Usual uses normal URL links. Intelligence uses named links (up to{" "}
          {LINK_INTELLIGENCE_ASSIGN.batchSize} at a time) — finish your active Intelligence links before
          requesting another batch.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Usual */}
        <div
          className={cn(
            "rounded-2xl border p-4 space-y-3",
            usual?.blocked ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.03]"
          )}
        >
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-muted mb-1">Normal</p>
            <p className="font-bricolage font-extrabold text-lux-text text-lg">Usual links</p>
            <p className="text-xs text-lux-muted mt-1.5 leading-relaxed">
              Up to {LINK_AUTO_ASSIGN.batchSize} links. Need fewer than{" "}
              {LINK_AUTO_ASSIGN.maxActiveBeforeBlock} active Usual links.
            </p>
          </div>
          {usual && (
            <div className="text-xs text-lux-muted tabular-nums space-y-0.5">
              <div>
                Your active:{" "}
                <span className={cn("font-bold", usual.blocked ? "text-amber-300" : "text-lux-text")}>
                  {usual.activeCount}
                </span>
              </div>
              <div>
                Pool: <span className="font-bold text-red-400">{usual.poolCount}</span>
              </div>
            </div>
          )}
          {usual?.blocked ? (
            <p className="text-xs text-amber-100/90 leading-relaxed">{usual.blockMessage}</p>
          ) : usual?.poolCount === 0 ? (
            <p className="text-xs text-lux-muted">No Usual links in the pool right now.</p>
          ) : (
            <p className="text-xs text-lux-muted">
              Ready: <strong className="text-lux-cyan">{usual?.wouldAssign ?? 0}</strong> link
              {(usual?.wouldAssign ?? 0) === 1 ? "" : "s"}
            </p>
          )}
          <Button
            variant="lux-cyan"
            size="md"
            disabled={!usual?.canAutoAssign || assigning !== null}
            onClick={() => handleAssign("usual")}
            className="w-full"
          >
            {assigning === "usual" ? "Assigning…" : "Get Usual links"}
          </Button>
        </div>

        {/* Intelligence */}
        <div
          className={cn(
            "rounded-2xl border p-4 space-y-3",
            intel?.blocked
              ? "border-amber-500/30 bg-amber-500/[0.06]"
              : "border-lux-cyan/35 bg-lux-cyan/10"
          )}
        >
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-cyan mb-1">✦ AI</p>
            <p className="font-bricolage font-extrabold text-lux-text text-lg">Intelligence links</p>
            <p className="text-xs text-lux-muted mt-1.5 leading-relaxed">
              Up to {LINK_INTELLIGENCE_ASSIGN.batchSize} named links. You must have{" "}
              <strong className="text-lux-text">0</strong> active Intelligence links to request more.
            </p>
          </div>
          {intel && (
            <div className="text-xs text-lux-muted tabular-nums space-y-0.5">
              <div>
                Your Intelligence active:{" "}
                <span className={cn("font-bold", intel.blocked ? "text-amber-300" : "text-lux-cyan")}>
                  {intel.activeCount}
                </span>
              </div>
              <div>
                Named pool: <span className="font-bold text-lux-cyan">{intel.poolCount}</span>
              </div>
            </div>
          )}
          {intel?.blocked ? (
            <p className="text-xs text-amber-100/90 leading-relaxed font-semibold">{intel.blockMessage}</p>
          ) : intel?.poolCount === 0 ? (
            <p className="text-xs text-lux-muted">
              No named Intelligence links — ask admin to upload with First, Last, URL.
            </p>
          ) : (
            <p className="text-xs text-lux-muted">
              Ready: <strong className="text-lux-cyan">{intel?.wouldAssign ?? 0}</strong> link
              {(intel?.wouldAssign ?? 0) === 1 ? "" : "s"}
            </p>
          )}
          <Button
            variant="lux"
            size="md"
            disabled={!intel?.canAutoAssign || assigning !== null}
            onClick={() => handleAssign("intelligence")}
            className="w-full"
          >
            {assigning === "intelligence" ? "Assigning…" : "Get Intelligence links"}
          </Button>
        </div>
      </div>
    </div>
  );
}
