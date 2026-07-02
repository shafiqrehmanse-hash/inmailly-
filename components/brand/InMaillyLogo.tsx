"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/** Stylized "i" mark — cyan orb, signal rings, white stem. */
export function InMaillyMark({
  height = 18,
  className,
}: {
  /** Pixel height — sized to match InMailly cap height in wordmark. */
  height?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const width = Math.round(height * (48 / 56));

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${uid}-orb`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="45%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#2563eb" />
        </radialGradient>
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="24" cy="17" r="20.5" stroke="#1e4d5c" strokeWidth="0.55" opacity="0.45" />
      <circle cx="24" cy="17" r="15.5" stroke="#1e5a6e" strokeWidth="0.6" opacity="0.55" />
      <circle cx="24" cy="17" r="10.5" stroke="#2a7a8f" strokeWidth="0.65" opacity="0.65" />

      <circle cx="24" cy="17" r="7.2" fill={`url(#${uid}-orb)`} filter={`url(#${uid}-glow)`} />
      <circle cx="21.2" cy="14.2" r="1.35" fill="white" opacity="0.85" />

      <rect x="18.75" y="31" width="10.5" height="22" rx="5.25" fill="white" />
      <rect
        x="18.75"
        y="31"
        width="10.5"
        height="4"
        rx="2"
        fill="#22d3ee"
        opacity="0.12"
      />
    </svg>
  );
}

export function InMaillyBrand({
  size = "md",
  showText = true,
  className,
  textClassName,
}: {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  textClassName?: string;
}) {
  const markHeight = { sm: 14, md: 17, lg: 20 }[size];
  const textSize = {
    sm: "text-base leading-none",
    md: "text-lg leading-none",
    lg: "text-xl leading-none",
  }[size];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <InMaillyMark height={markHeight} className="translate-y-[0.5px]" />
      {showText && (
        <span
          className={cn(
            "font-bricolage font-extrabold tracking-tight text-lux-text",
            textSize,
            textClassName
          )}
        >
          InMailly
        </span>
      )}
    </span>
  );
}
