"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ClientDashboard from "@/components/client/ClientDashboard";
import ClientContractHubCard from "@/components/client/ClientContractHubCard";
import ClientBrandingHubCard from "@/components/client/ClientBrandingHubCard";
import ClientWhitelabelCard from "@/components/client/ClientWhitelabelCard";
import ClientCampaignProfilesHubCard from "@/components/client/ClientCampaignProfilesHubCard";
import ClientCampaignProfilesSection from "@/components/client/ClientCampaignProfilesSection";
import ClientPackageProgress from "@/components/client/ClientPackageProgress";
import { buildClientDisplayDashboard } from "@/lib/client-dashboard-display";
import { mapPortalToDashboard } from "@/lib/map-portal-to-dashboard";
import type { ClientDashboardLiveData } from "@/lib/map-portal-to-dashboard";

export default function ClientDashboardPage() {
  const router = useRouter();
  const [live, setLive] = useState<ClientDashboardLiveData | null>(null);
  const [usingDemoFill, setUsingDemoFill] = useState(false);
  const [isPreview, setIsPreview] = useState(true);
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

  if (loading) {
    return <div className="text-lux-muted py-12 text-center">Loading dashboard…</div>;
  }

  if (error || !live) {
    return <div className="text-red-400 py-12 text-center">{error || "Dashboard unavailable"}</div>;
  }

  return (
    <>
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
      <ClientBrandingHubCard />
      <ClientCampaignProfilesHubCard />
      <ClientWhitelabelCard />
      <ClientDashboard mode="full" live={live} usingDemoFill={usingDemoFill} />
      {live.packageProgress && (
        <div className="mt-8">
          <ClientPackageProgress progress={live.packageProgress} />
        </div>
      )}
      <div className="mt-10 pt-8 border-t border-white/[0.06]">
        <ClientCampaignProfilesSection showHeader limit={3} compact />
      </div>
    </>
  );
}
