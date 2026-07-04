"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type VictoryCelebrationPayload = {
  kind: "deal_closed" | "meeting_booked";
  title: string;
  subtitle: string;
  message: string;
  leadName: string;
};

const KIND_UI = {
  deal_closed: {
    emoji: "🏆",
    eyebrow: "Trophy unlocked",
    detailLabel: "Closed deal",
    gradient: "from-amber-400 via-lux-cyan to-lux-violet",
    border: "border-amber-400/35",
    shadow: "shadow-[0_0_60px_rgba(251,191,36,0.18)]",
    eyebrowColor: "text-amber-300",
    detailNote: "Counts on Team Performance — score, rank, and closed-deal trophies.",
    primaryLabel: "View leaderboard →",
    primaryHref: "/team/performance",
  },
  meeting_booked: {
    emoji: "📅",
    eyebrow: "Meeting secured",
    detailLabel: "Meeting booked",
    gradient: "from-lux-cyan via-lux-blue to-lux-violet",
    border: "border-lux-cyan/35",
    shadow: "shadow-[0_0_60px_rgba(34,211,238,0.18)]",
    eyebrowColor: "text-lux-cyan",
    detailNote: "Your whole team sees this on the banner for 24 hours. Push toward the close.",
    primaryLabel: "View team board →",
    primaryHref: "/team/performance",
  },
} as const;

export default function VictoryCelebration({
  celebration,
  onClose,
}: {
  celebration: VictoryCelebrationPayload | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!celebration) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [celebration]);

  if (!mounted || !celebration) return null;

  const ui = KIND_UI[celebration.kind];

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="victory"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className={cn(
            "relative w-full max-w-md overflow-hidden rounded-2xl border bg-lux-bg2",
            ui.border,
            ui.shadow
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={cn("h-1 bg-gradient-to-r", ui.gradient)} />
          <div className="px-6 py-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.05 }}
              className="text-6xl leading-none"
              aria-hidden
            >
              {ui.emoji}
            </motion.div>
            <div>
              <p className={cn("text-[0.65rem] font-bold uppercase tracking-[0.2em] mb-2", ui.eyebrowColor)}>
                {ui.eyebrow}
              </p>
              <h2 className="font-bricolage font-extrabold text-2xl text-lux-text leading-tight">
                {celebration.title}
              </h2>
              <p className="text-lux-cyan font-semibold mt-2">{celebration.subtitle}</p>
            </div>
            <p className="text-sm text-lux-muted leading-relaxed">{celebration.message}</p>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left">
              <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted font-bold mb-1">
                {ui.detailLabel}
              </p>
              <p className="text-lux-text font-semibold">{celebration.leadName}</p>
              <p className="text-[0.72rem] text-lux-muted mt-1">{ui.detailNote}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link href={ui.primaryHref} className="flex-1" onClick={onClose}>
                <Button variant="lux" className="w-full">
                  {ui.primaryLabel}
                </Button>
              </Link>
              <Button variant="lux-soft" className="flex-1" onClick={onClose}>
                Keep crushing it
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
