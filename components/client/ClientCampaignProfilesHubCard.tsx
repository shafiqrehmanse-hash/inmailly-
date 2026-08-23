"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientCampaignProfilesHubCard() {
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/client/campaign-profiles")
      .then((r) => r.json())
      .then((d) => {
        setCount(d.profiles?.length || 0);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || count === 0) return null;

  return (
    <Link
      href="/client/profiles"
      className="lux-card-elite p-5 block border-lux-cyan/30 bg-gradient-to-r from-lux-cyan/[0.08] via-transparent to-transparent hover:border-lux-cyan/50 transition-colors mb-6"
    >
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-lux-cyan mb-1">
        Campaign sender profiles
      </p>
      <p className="font-bricolage font-extrabold text-lux-text text-lg leading-snug">
        {count} LinkedIn {count === 1 ? "profile is" : "profiles are"} active on your campaign →
      </p>
      <p className="text-sm text-lux-muted mt-2 leading-relaxed">
        See the headlines, titles, and profile photos your outreach team is using when sending InMails.
      </p>
    </Link>
  );
}
