"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ClientCampaignProfileCard, {
  type CampaignProfileCardData,
} from "@/components/client/ClientCampaignProfileCard";

export default function ClientCampaignProfilesSection({
  showHeader = true,
  compact = false,
  limit,
  portalToken,
  initialProfiles,
  initialProjectName,
}: {
  showHeader?: boolean;
  compact?: boolean;
  limit?: number;
  /** Token portal — load profiles from /api/client/portal */
  portalToken?: string;
  initialProfiles?: CampaignProfileCardData[];
  initialProjectName?: string;
}) {
  const [profiles, setProfiles] = useState<CampaignProfileCardData[]>(initialProfiles || []);
  const [projectName, setProjectName] = useState(initialProjectName || "");
  const [loading, setLoading] = useState(!initialProfiles);

  const load = useCallback(() => {
    if (initialProfiles) {
      setProfiles(initialProfiles);
      setLoading(false);
      return;
    }

    const url = portalToken
      ? `/api/client/portal?token=${encodeURIComponent(portalToken)}`
      : "/api/client/campaign-profiles";

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.profiles) setProfiles(d.profiles);
        const name = d.project?.name;
        if (name) setProjectName(name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [portalToken, initialProfiles]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialProfiles) setProfiles(initialProfiles);
    if (initialProjectName) setProjectName(initialProjectName);
  }, [initialProfiles, initialProjectName]);

  const visible = limit ? profiles.slice(0, limit) : profiles;

  if (loading) {
    return (
      <div className="lux-card-elite p-6 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-4" />
        <div className="h-32 bg-white/5 rounded" />
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="lux-card-elite p-6 border-white/[0.06]">
        {showHeader && (
          <>
            <p className="text-[0.62rem] uppercase tracking-[0.28em] text-lux-muted font-semibold mb-1">
              Campaign sender profiles
            </p>
            <h2 className="font-bricolage font-extrabold text-xl text-lux-text">LinkedIn identities in use</h2>
          </>
        )}
        <p className="text-sm text-lux-muted mt-3 leading-relaxed">
          No sender profiles yet. Your campaign manager adds LinkedIn profile screenshots here — each one shows the
          headline, title, and photos prospects see when they receive InMails from that account.
        </p>
        {!portalToken && (
          <p className="text-xs text-lux-cyan/80 mt-3">
            Campaign managers: add profiles from your assigned project in{" "}
            <Link href="/campaign/hub" className="underline hover:text-lux-cyan">
              Campaign hub
            </Link>
            . Admins: Admin → Clients → expand client → Campaign sender profiles.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showHeader && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.28em] text-lux-cyan font-semibold mb-1">
              Active on your campaign
            </p>
            <h2 className="font-bricolage font-extrabold text-xl sm:text-2xl text-lux-text">
              Sender profiles in use
            </h2>
            <p className="text-sm text-lux-muted mt-2 max-w-2xl leading-relaxed">
              These LinkedIn profiles are sending InMails for{" "}
              <strong className="text-lux-text">{projectName || "your campaign"}</strong>. Headlines, titles, and
              photos below match what prospects see on LinkedIn.
            </p>
          </div>
          {limit && profiles.length > limit && !portalToken && (
            <Link href="/client/profiles" className="text-sm text-lux-cyan hover:underline font-semibold">
              View all {profiles.length} →
            </Link>
          )}
        </div>
      )}
      <div className={compact ? "flex flex-wrap gap-4" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-5"}>
        {visible.map((p) => (
          <ClientCampaignProfileCard key={p.id} profile={p} compact={compact} />
        ))}
      </div>
    </div>
  );
}
