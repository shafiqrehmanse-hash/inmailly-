"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeamInfoDocHubCard({ infoDocHref = "/team/info-doc" }: { infoDocHref?: string }) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/team/info-doc")
      .then((r) => r.json())
      .then((d) => setPending(Boolean(d.pendingDoc)))
      .catch(() => {});
  }, []);

  if (!pending) return null;

  return (
    <Link
      href={infoDocHref}
      className="lux-card-elite p-5 block border-amber-500/45 bg-gradient-to-r from-amber-500/[0.12] via-amber-600/[0.06] to-transparent hover:border-amber-400/60 transition-colors"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-lg" aria-hidden>
          📋
        </span>
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-amber-400">
          Action required — Info Doc
        </p>
      </div>
      <p className="font-bricolage font-extrabold text-amber-200 text-lg leading-snug">
        Complete your employee Info Doc →
      </p>
      <p className="text-sm text-amber-400/90 mt-2 leading-relaxed">
        Upload ID photos, emergency contact, references, and employment details.
      </p>
    </Link>
  );
}
