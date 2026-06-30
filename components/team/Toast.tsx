"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export default function Toast({
  message,
  type = "success",
  onDismiss,
}: {
  message: string;
  type?: ToastType;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return createPortal(
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl lux-card text-sm font-medium animate-slide-up",
        type === "success" && "border-lux-cyan/40 text-lux-cyan",
        type === "error" && "border-red-500/40 text-red-400",
        type === "info" && "border-lux-blue/40 text-lux-text"
      )}
    >
      {message}
    </div>,
    document.body
  );
}
