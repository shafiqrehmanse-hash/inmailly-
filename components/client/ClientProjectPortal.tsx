"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ClientDashboard from "@/components/client/ClientDashboard";
import LuxBackground from "@/components/home/LuxBackground";
import { mapPortalToDashboard } from "@/lib/map-portal-to-dashboard";
import type { ClientDashboardLiveData } from "@/lib/map-portal-to-dashboard";

export default function ClientProjectPortal({ token }: { token: string }) {
  const [live, setLive] = useState<ClientDashboardLiveData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/client/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setLive(mapPortalToDashboard(d));
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

  if (!live) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center text-lux-muted">
        Loading campaign data…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text">
      <LuxBackground />
      <header className="border-b border-white/[0.06] bg-lux-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-lux-blue/40 bg-lux-blue/10 flex items-center justify-center font-bricolage font-extrabold text-sm text-lux-blue">
              I
            </div>
            <span className="font-bricolage font-extrabold text-lux-text">InMailly</span>
            <span className="text-[0.6rem] uppercase tracking-wider text-amber-400/90 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
              Team portal
            </span>
          </Link>
          <Link href="/campaign/hub" className="text-[0.7rem] text-lux-muted hover:text-lux-cyan">
            Campaign hub →
          </Link>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        <div className="mb-6 lux-card p-4 border-amber-500/25 bg-amber-500/5">
          <p className="text-[0.65rem] uppercase tracking-widest text-amber-400 font-semibold mb-1">
            Internal team view
          </p>
          <p className="text-sm text-lux-muted leading-relaxed">
            This link is for campaign managers and admins — it shows <strong className="text-lux-text">real logged data only</strong>.
            Clients sign in at <Link href="/client/login" className="text-lux-cyan hover:underline">/client/login</Link> for
            their branded dashboard with sample data until responses arrive.
          </p>
        </div>
        <div className="mb-8">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-1">
            {live.clientLabel}
          </p>
          <h1 className="font-bricolage font-extrabold text-3xl text-lux-text">{live.projectName}</h1>
          <p className="text-lux-muted mt-2 text-sm capitalize">
            Status: {live.status} · {live.stats.sends} InMail{live.stats.sends !== 1 ? "s" : ""} sent ·{" "}
            {live.stats.total} response{live.stats.total !== 1 ? "s" : ""}
          </p>
        </div>
        <ClientDashboard mode="full" live={live} />
      </main>
    </div>
  );
}
