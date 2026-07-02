"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function ClientBrandingHubCard() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/client/branding")
      .then((r) => r.json())
      .then((d) => setPending(Boolean(d.pendingRequest)))
      .catch(() => {});
  }, []);

  if (!pending) return null;

  return (
    <Link
      href="/client/branding"
      className="lux-card-elite p-5 block border-red-500/50 bg-gradient-to-r from-red-500/[0.12] via-red-600/[0.06] to-transparent hover:border-red-400/70 transition-colors shadow-[0_0_28px_rgba(239,68,68,0.15)] mb-6"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span
          className="admin-alert-dot shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]"
          aria-hidden
        />
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-red-400">
          Action required — submit campaign branding
        </p>
      </div>
      <p className="font-bricolage font-extrabold text-red-300 text-lg leading-snug">
        Submit your InMail subject, script & Sales Nav details →
      </p>
      <p className="text-sm font-bold text-red-400/90 mt-2 leading-relaxed">
        We need your message copy and Sales Navigator link before your campaign manager can start outreach.
      </p>
    </Link>
  );
}
