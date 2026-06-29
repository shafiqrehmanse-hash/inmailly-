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
        Loading your dashboard…
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
            <span className="text-[0.6rem] uppercase tracking-wider text-lux-muted border border-white/[0.08] px-2 py-0.5">
              Client
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[0.65rem] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        <div className="mb-8">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-1">
            {live.clientLabel}
          </p>
          <h1 className="font-bricolage font-extrabold text-3xl text-lux-text">Campaign dashboard</h1>
          <p className="text-lux-muted mt-2 text-sm">
            {live.projectName} — real-time responses from your outreach team.
          </p>
        </div>
        <ClientDashboard mode="full" live={live} />
      </main>
    </div>
  );
}
