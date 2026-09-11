"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { GROW_DAILY_USED_CAP } from "@/lib/grow-cap";
import type { TeamMember } from "@/lib/types";

const PHOTO_CLOSED = "inmailly:photo-prompt-closed";

export default function GrowAccountsPrompt({ member }: { member: TeamMember }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/team/grow")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setPending(d.pending || 0);
        setRemaining(d.remainingToday ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  useEffect(() => {
    if (!mounted || pending <= 0 || remaining <= 0) return;
    const sessionKey = `inmailly-grow-prompt:${member.id}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const show = () => {
      if (sessionStorage.getItem(sessionKey)) return;
      window.setTimeout(() => setOpen(true), 500);
    };

    if (member.photo_url) {
      const t = window.setTimeout(show, 700);
      return () => window.clearTimeout(t);
    }

    const onPhotoClosed = () => show();
    window.addEventListener(PHOTO_CLOSED, onPhotoClosed);
    return () => window.removeEventListener(PHOTO_CLOSED, onPhotoClosed);
  }, [mounted, member.id, member.photo_url, pending, remaining]);

  function dismiss() {
    sessionStorage.setItem(`inmailly-grow-prompt:${member.id}`, "1");
    setOpen(false);
  }

  function go() {
    dismiss();
    router.push("/team/grow");
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="grow-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-lux-cyan/30 bg-lux-bg2 shadow-[0_0_48px_rgba(34,211,238,0.12)]"
          >
            <div className="h-1 bg-gradient-to-r from-lux-cyan via-lux-violet to-amber-400" />
            <div className="px-6 py-8 text-center space-y-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lux-cyan">
                Grow our accounts
              </p>
              <h2 className="font-bricolage font-extrabold text-xl text-lux-text">
                Send connection requests
              </h2>
              <p className="text-sm text-lux-muted leading-relaxed">
                Hi {member.name.split(" ")[0]}, you have{" "}
                <strong className="text-lux-text">{pending}</strong> InMailly LinkedIn profile
                {pending === 1 ? "" : "s"} waiting. Open each one, send a connect, then mark used.
                Max <strong className="text-lux-cyan">{GROW_DAILY_USED_CAP} per day</strong>.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <Button type="button" variant="lux" className="w-full" onClick={go}>
                  Open Grow accounts
                </Button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-xs text-lux-muted hover:text-lux-text py-2 transition-colors"
                >
                  Later this session
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
