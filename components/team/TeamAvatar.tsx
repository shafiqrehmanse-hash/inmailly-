"use client";

import { cn } from "@/lib/utils";

const sizeClass = {
  xs: "w-7 h-7 text-[0.58rem]",
  sm: "w-8 h-8 text-[0.62rem]",
  md: "w-9 h-9 text-xs",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
} as const;

export default function TeamAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: {
  name: string;
  photoUrl?: string | null;
  size?: keyof typeof sizeClass;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover object-center shrink-0 ring-2 ring-white/20 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]",
          sizeClass[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full shrink-0 flex items-center justify-center font-bold text-white",
        "bg-gradient-to-br from-sky-400 via-blue-500 to-violet-500",
        "ring-2 ring-white/25 shadow-[0_4px_14px_rgba(56,189,248,0.35)]",
        sizeClass[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
