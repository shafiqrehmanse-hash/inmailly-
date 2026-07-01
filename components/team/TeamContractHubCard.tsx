"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TeamContractHubCard() {
  const [pending, setPending] = useState(false);
  const [terminated, setTerminated] = useState(false);

  useEffect(() => {
    fetch("/api/team/contract")
      .then((r) => r.json())
      .then((d) => {
        setPending(Boolean(d.pendingOffer || d.contract?.status === "pending_signature"));
        setTerminated(d.contract?.status === "terminated" || Boolean(d.termination));
      })
      .catch(() => {});
  }, []);

  if (!pending && !terminated) return null;

  if (pending) {
    return (
      <Link
        href="/team/contract"
        className="lux-card-elite p-5 block border-red-500/50 bg-gradient-to-r from-red-500/[0.12] via-red-600/[0.06] to-transparent hover:border-red-400/70 transition-colors shadow-[0_0_28px_rgba(239,68,68,0.15)]"
      >
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className="admin-alert-dot shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]"
            aria-hidden
          />
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-red-400">
            Action required — sign agreement
          </p>
        </div>
        <p className="font-bricolage font-extrabold text-red-300 text-lg leading-snug">
          Sign your employment offer now →
        </p>
        <p className="text-sm font-bold text-red-400/90 mt-2 leading-relaxed">
          You must review all terms and submit your signature before you can continue working.
        </p>
      </Link>
    );
  }

  return (
    <Link
      href="/team/contract"
      className="lux-card-elite p-5 block border-rose-500/30 bg-rose-500/[0.06] hover:border-rose-400/40 transition-colors"
    >
      <p className="text-[0.62rem] font-bold uppercase tracking-widest text-rose-400 mb-1">Contract ended</p>
      <p className="font-semibold text-lux-text">View termination notice →</p>
      <p className="text-xs text-lux-muted mt-1">Download your official termination document.</p>
    </Link>
  );
}
