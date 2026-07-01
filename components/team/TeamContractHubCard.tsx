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
        className="lux-card-elite p-5 block border-amber-500/40 bg-gradient-to-r from-amber-500/[0.1] to-lux-cyan/[0.05] hover:border-amber-400/50 transition-colors"
      >
        <p className="text-[0.62rem] font-bold uppercase tracking-widest text-amber-400 mb-1">
          Action required
        </p>
        <p className="font-bricolage font-bold text-lux-text">Sign your employment offer →</p>
        <p className="text-xs text-lux-muted mt-1">Review terms and submit your signature in the dashboard.</p>
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
