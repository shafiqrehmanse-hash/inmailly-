"use client";

import { useEffect, useState } from "react";
import ClientDashboard from "@/components/client/ClientDashboard";
import ClientPackageProgress from "@/components/client/ClientPackageProgress";
import { mapPortalToDashboard } from "@/lib/map-portal-to-dashboard";
import type { ClientDashboardLiveData } from "@/lib/map-portal-to-dashboard";

export default function EmbedCampaignPortal({
  token,
  brandName,
  initialLive = null,
}: {
  token: string;
  /** Optional white-label client name override from ?brand= */
  brandName?: string | null;
  /** Server-prefetched data so the board paints without waiting for a second round-trip */
  initialLive?: ClientDashboardLiveData | null;
}) {
  const [live, setLive] = useState<ClientDashboardLiveData | null>(initialLive);
  const [error, setError] = useState("");

  useEffect(() => {
    // Refresh in background if we already have SSR data; otherwise load fresh
    let cancelled = false;
    fetch(`/api/embed/portal?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.error) {
          if (!initialLive) setError(d.error);
          return;
        }
        const mapped = mapPortalToDashboard(d);
        const brand = brandName?.trim();
        setLive(brand ? { ...mapped, clientLabel: brand } : mapped);
      })
      .catch(() => {
        if (!cancelled && !initialLive) setError("Failed to load campaign data");
      });
    return () => {
      cancelled = true;
    };
  }, [token, brandName, initialLive]);

  if (error && !live) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <p className="text-red-400 font-semibold mb-2">{error}</p>
          <p className="text-lux-muted text-sm leading-relaxed">
            Contact your campaign manager for a fresh dashboard file if this keeps happening.
          </p>
        </div>
      </div>
    );
  }

  if (!live) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center text-lux-muted text-sm">
        Opening dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text">
      <header className="border-b border-white/[0.06] bg-lux-bg/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div>
            <p className="text-[0.6rem] uppercase tracking-widest text-lux-muted">{live.clientLabel}</p>
            <p className="font-bricolage font-bold text-lux-text text-sm sm:text-base">{live.projectName}</p>
          </div>
          <span className="text-[0.58rem] uppercase tracking-wider text-lux-cyan border border-lux-cyan/30 px-2 py-0.5">
            Live campaign
          </span>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <ClientDashboard mode="full" live={live} />
        {live.packageProgress && (
          <div className="mt-8">
            <ClientPackageProgress progress={live.packageProgress} />
          </div>
        )}
      </main>
    </div>
  );
}
