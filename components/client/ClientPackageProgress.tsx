"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PackageProgress = {
  target: number;
  completed: number;
  percent: number;
};

export default function ClientPackageProgress({
  progress,
  className = "",
}: {
  progress: PackageProgress;
  className?: string;
}) {
  const { target, completed, percent } = progress;
  const complete = percent >= 100;
  const remaining = Math.max(0, target - completed);

  return (
    <div
      className={cn(
        "relative overflow-hidden border bg-gradient-to-br from-lux-bg2/90 via-lux-card/95 to-lux-bg2/80 p-5 sm:p-6",
        complete
          ? "border-emerald-500/35 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
          : "border-lux-blue/25 shadow-[0_0_40px_rgba(37,99,235,0.08)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(105deg, transparent 40%, rgba(34,211,238,0.06) 50%, transparent 60%)",
        }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.28em] text-lux-cyan font-semibold mb-1.5">
            Campaign package
          </p>
          <h3 className="font-bricolage font-extrabold text-xl sm:text-2xl text-lux-text tracking-tight">
            {complete ? "Package delivered" : "InMail delivery progress"}
          </h3>
          <p className="text-sm text-lux-muted mt-1.5 max-w-md leading-relaxed">
            {complete
              ? "Your full InMail package has been sent. Responses continue to appear in your inbox above."
              : "Each verified send proof counts as one InMail toward your package."}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div
            className={cn(
              "font-bricolage font-extrabold text-3xl sm:text-4xl tabular-nums tracking-tight",
              complete ? "text-emerald-400" : "text-lux-text"
            )}
          >
            {Math.min(100, Math.round(percent))}%
          </div>
          <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-0.5">Complete</div>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="h-3 sm:h-3.5 rounded-full bg-white/[0.06] border border-white/[0.08] overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full relative",
              complete
                ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-lux-cyan"
                : "bg-gradient-to-r from-lux-blue via-lux-violet to-lux-cyan"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percent)}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            {!complete && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2.5s_ease-in-out_infinite]" />
            )}
          </motion.div>
        </div>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-bricolage font-extrabold text-2xl sm:text-3xl text-lux-text tabular-nums">
            {completed.toLocaleString()}
            <span className="text-lux-muted font-semibold text-lg sm:text-xl"> / {target.toLocaleString()}</span>
          </div>
          <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">InMails delivered</div>
        </div>
        {!complete && (
          <div className="text-right">
            <div className="text-sm font-semibold text-lux-cyan tabular-nums">{remaining.toLocaleString()} left</div>
            <div className="text-[0.6rem] text-lux-muted/80 uppercase tracking-wider">Until package complete</div>
          </div>
        )}
        {complete && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% delivered
          </div>
        )}
      </div>
    </div>
  );
}
