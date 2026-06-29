"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

type PortalData = {
  project: {
    id: string;
    name: string;
    status: string;
    audience_brief: string | null;
    clients: { name: string; company_name: string | null } | { name: string; company_name: string | null }[] | null;
  };
  stats: { total: number; interested: number };
  responses: {
    id: string;
    name: string;
    company: string | null;
    status: string;
    notes: string | null;
    created_at: string;
  }[];
};

function clientLabel(clients: PortalData["project"]["clients"]) {
  if (!clients) return "Client";
  const c = Array.isArray(clients) ? clients[0] : clients;
  return c?.company_name || c?.name || "Client";
}

export default function ClientProjectPortal({ token }: { token: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/client/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load dashboard"));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center p-6">
        <div className="lux-card p-8 text-center max-w-md">
          <p className="text-red-400">{error}</p>
          <Link href="/" className="text-lux-cyan text-sm mt-4 inline-block">
            ← Back to InMailly
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center text-lux-muted">
        Loading your dashboard…
      </div>
    );
  }

  const label = clientLabel(data.project.clients);

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text">
      <header className="border-b border-white/[0.08] bg-lux-bg2/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold">{label}</p>
            <h1 className="font-bricolage font-extrabold text-xl">{data.project.name}</h1>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[0.65rem] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 space-y-8">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="lux-card p-5 text-center">
            <div className="font-bricolage font-extrabold text-3xl text-lux-cyan tabular-nums">
              {data.stats.total}
            </div>
            <div className="text-[0.65rem] uppercase tracking-widest text-lux-muted mt-1">Total responses</div>
          </div>
          <div className="lux-card p-5 text-center">
            <div className="font-bricolage font-extrabold text-3xl text-emerald-400 tabular-nums">
              {data.stats.interested}
            </div>
            <div className="text-[0.65rem] uppercase tracking-widest text-lux-muted mt-1">Hot / interested</div>
          </div>
        </div>

        <section>
          <h2 className="font-bricolage font-extrabold text-lg mb-4">Live responses</h2>
          {data.responses.length === 0 ? (
            <div className="lux-card p-10 text-center text-lux-muted text-sm">
              Your outreach team hasn&apos;t logged any responses yet. Check back soon.
            </div>
          ) : (
            <div className="space-y-3">
              {data.responses.map((r) => (
                <div key={r.id} className="lux-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="font-bricolage font-bold text-lux-text">{r.name}</div>
                      {r.company && <div className="text-sm text-lux-muted">{r.company}</div>}
                    </div>
                    <Badge variant={r.status as Parameters<typeof Badge>[0]["variant"]}>{r.status}</Badge>
                  </div>
                  {r.notes && (
                    <p className="text-sm text-lux-muted leading-relaxed border-l-2 border-lux-cyan/40 pl-4 my-3">
                      {r.notes}
                    </p>
                  )}
                  <div className="text-xs text-lux-muted/70">{formatDate(r.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
