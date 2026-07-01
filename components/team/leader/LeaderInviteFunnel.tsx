"use client";

import { useCallback, useEffect, useState } from "react";

type FunnelRecruit = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  hasClaimedLink: boolean;
  hasLoggedLead: boolean;
};

type Funnel = {
  code: string;
  label: string | null;
  recruits: FunnelRecruit[];
};

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={done ? "text-emerald-400" : "text-slate-500"}>
      {done ? "✓" : "○"} {label}
    </span>
  );
}

export default function LeaderInviteFunnel() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/leader/invite-funnel");
    const data = await res.json();
    setFunnels(data.funnels || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="lux-card-elite p-4 text-sm text-lux-muted">Loading invite funnel…</div>;
  }

  if (!funnels.length) {
    return (
      <div className="lux-card-elite p-4 text-sm text-lux-muted">
        Generate invite codes below — signups will appear here with onboarding progress.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-cyan/80">Invite funnel</p>
      {funnels.map((f) => (
        <div key={f.code} className="lux-card-elite p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-lux-cyan font-bold">{f.code}</span>
            {f.label && <span className="text-xs text-lux-muted">{f.label}</span>}
          </div>
          {f.recruits.length === 0 ? (
            <p className="text-sm text-lux-muted">No signups yet.</p>
          ) : (
            <div className="space-y-2">
              {f.recruits.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm border-t border-white/[0.04] pt-2 first:border-0 first:pt-0"
                >
                  <div>
                    <span className="font-medium text-lux-text">{r.name}</span>
                    <span className="text-[0.62rem] text-lux-muted ml-2">{r.email}</span>
                  </div>
                  <div className="flex gap-3 text-[0.62rem]">
                    <Step done={true} label="Signed up" />
                    <Step done={r.hasClaimedLink} label="First link" />
                    <Step done={r.hasLoggedLead} label="First lead" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
