"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Link from "next/link";

export type DealCelebrationPayload = {
  title: string;
  subtitle: string;
  message: string;
  leadName: string;
};

export default function DealClosedCelebration({
  celebration,
  onClose,
}: {
  celebration: DealCelebrationPayload | null;
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

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="deal-trophy"
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
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-400/35 bg-lux-bg2 shadow-[0_0_60px_rgba(251,191,36,0.18)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 bg-gradient-to-r from-amber-400 via-lux-cyan to-lux-violet" />
          <div className="px-6 py-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.05 }}
              className="text-6xl leading-none"
              aria-hidden
            >
              🏆
            </motion.div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-300 mb-2">
                Trophy unlocked
              </p>
              <h2 className="font-bricolage font-extrabold text-2xl text-lux-text leading-tight">
                {celebration.title}
              </h2>
              <p className="text-lux-cyan font-semibold mt-2">{celebration.subtitle}</p>
            </div>
            <p className="text-sm text-lux-muted leading-relaxed">{celebration.message}</p>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left">
              <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted font-bold mb-1">
                Closed deal
              </p>
              <p className="text-lux-text font-semibold">{celebration.leadName}</p>
              <p className="text-[0.72rem] text-lux-muted mt-1">
                Counts on Team Performance — score, rank, and closed-deal trophies.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Link href="/team/performance" className="flex-1" onClick={onClose}>
                <Button variant="lux" className="w-full">
                  View leaderboard →
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
