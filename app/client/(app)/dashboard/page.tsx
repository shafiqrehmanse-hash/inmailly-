"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ClientDashboard from "@/components/client/ClientDashboard";
import ClientContractHubCard from "@/components/client/ClientContractHubCard";
import ClientPackageProgress from "@/components/client/ClientPackageProgress";
import LuxBackground from "@/components/home/LuxBackground";
import { buildClientDisplayDashboard } from "@/lib/client-dashboard-display";
import { mapPortalToDashboard } from "@/lib/map-portal-to-dashboard";
import type { ClientDashboardLiveData } from "@/lib/map-portal-to-dashboard";
import { createClient } from "@/lib/supabase/client";

export default function ClientDashboardPage() {
  const router = useRouter();
  const [live, setLive] = useState<ClientDashboardLiveData | null>(null);
  const [usingDemoFill, setUsingDemoFill] = useState(false);
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
        const mapped = mapPortalToDashboard({
          project: data.project,
          stats: data.stats,
          responses: data.responses,
          proofs: data.proofs,
        });
        const { display, usingDemoFill: demo } = buildClientDisplayDashboard(mapped);
        setLive(display);
        setUsingDemoFill(demo);
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
            {!usingDemoFill && isPreview && (
              <Link href="/contact" className="lux-btn-primary text-[0.75rem] py-2.5 px-5">
                Launch campaign
              </Link>
            )}
            <button type="button" onClick={logout} className="text-sm text-lux-muted hover:text-lux-text">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        {isPreview && !usingDemoFill && (
          <div className="mb-6 lux-card p-4 border-lux-cyan/25">
            <p className="text-[0.65rem] uppercase tracking-widest text-lux-cyan font-semibold mb-1">
              Preview mode
            </p>
            <p className="text-sm text-lux-muted">
              Book a call to go live — your team will populate this dashboard with real campaign data.
            </p>
          </div>
        )}
        {usingDemoFill && (
          <div className="mb-6 lux-card p-4 border-violet-500/25 bg-violet-500/5">
            <p className="text-[0.65rem] uppercase tracking-widest text-violet-300 font-semibold mb-1">
              Your command center
            </p>
            <p className="text-sm text-lux-muted leading-relaxed">
              This is how your dashboard looks during a campaign. Sample metrics and responses are shown until
              your outreach team logs the first real activity — then everything updates automatically.
            </p>
          </div>
        )}
        <div className="mb-6">
          <h1 className="font-bricolage font-extrabold text-3xl text-lux-text">{live.projectName}</h1>
          <p className="text-lux-muted mt-2 text-sm capitalize">Status: {live.status}</p>
        </div>
        <ClientContractHubCard />
        <ClientDashboard mode="full" live={live} usingDemoFill={usingDemoFill} />
        {live.packageProgress && (
          <div className="mt-8">
            <ClientPackageProgress progress={live.packageProgress} />
          </div>
        )}
      </main>
    </div>
  );
}
