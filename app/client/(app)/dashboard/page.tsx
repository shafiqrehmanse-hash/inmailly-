"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ClientDashboard from "@/components/client/ClientDashboard";
import LuxBackground from "@/components/home/LuxBackground";
import { mapPortalToDashboard } from "@/lib/map-portal-to-dashboard";
import type { ClientDashboardLiveData } from "@/lib/map-portal-to-dashboard";
import { createClient } from "@/lib/supabase/client";

export default function ClientDashboardPage() {
  const router = useRouter();
  const [live, setLive] = useState<ClientDashboardLiveData | null>(null);
  const [isPreview, setIsPreview] = useState(true);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/client/dashboard")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/client/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || data.error) {
          setError(data?.error || "Could not load dashboard");
          setLoading(false);
          return;
        }
        setIsPreview(Boolean(data.isPreview));
        setClientName(data.client?.name || "");
        setLive(
          mapPortalToDashboard({
            project: data.project,
            stats: data.stats,
            responses: data.responses,
            proofs: data.proofs,
          })
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
      });
  }, [router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/client/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center text-lux-muted">
        Loading dashboard…
      </div>
    );
  }

  if (error || !live) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center text-red-400 px-6 text-center">
        {error || "Dashboard unavailable"}
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-lux-muted hidden sm:inline">{clientName}</span>
            <Link href="/contact" className="lux-btn-primary text-[0.75rem] py-2.5 px-5">
              Launch campaign
            </Link>
            <button type="button" onClick={logout} className="text-sm text-lux-muted hover:text-lux-text">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {isPreview && (
          <div className="mb-6 lux-card p-4 border-lux-cyan/25 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-widest text-lux-cyan font-semibold mb-1">
                Preview dashboard
              </p>
              <p className="text-sm text-lux-muted">
                This is your real dashboard layout. Book a call to go live — we&apos;ll connect your audience, scripts, and team.
              </p>
            </div>
            <Link href="/contact" className="lux-btn-primary text-sm px-4 py-2.5 shrink-0">
              Book launch call →
            </Link>
          </div>
        )}
        <div className="mb-6">
          <h1 className="font-bricolage font-extrabold text-3xl text-lux-text">{live.projectName}</h1>
          <p className="text-lux-muted mt-2 text-sm capitalize">Status: {live.status}</p>
        </div>
        <ClientDashboard mode="full" live={live} />
      </main>
    </div>
  );
}
