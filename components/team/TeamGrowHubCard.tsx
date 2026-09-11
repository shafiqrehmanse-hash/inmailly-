"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeamGrowHubCard() {
  const [pending, setPending] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    fetch("/api/team/grow")
      .then((r) => r.json())
      .then((d) => {
        setPending(d.pending || 0);
        setRemaining(d.remainingToday ?? 0);
      })
      .catch(() => {});
  }, []);

  if (!pending) return null;

  return (
    <Link
      href="/team/grow"
      className="lux-card-elite p-5 block border-lux-cyan/40 bg-gradient-to-r from-lux-cyan/[0.12] via-lux-violet/[0.06] to-transparent hover:border-lux-cyan/60 transition-colors"
    >
      <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-lux-cyan mb-2">
        Grow our accounts
      </p>
      <p className="font-bricolage font-extrabold text-lux-text text-lg leading-snug">
        {pending} profile{pending === 1 ? "" : "s"} waiting for a connection request →
      </p>
      <p className="text-sm text-lux-muted mt-2">
        {remaining > 0
          ? `${remaining} left on your daily cap. Open, connect, mark used.`
          : "Daily cap reached — remaining profiles wait until tomorrow."}
      </p>
    </Link>
  );
}
