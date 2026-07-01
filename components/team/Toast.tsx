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
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return createPortal(
    <div className="lux-toast-anchor" role="status" aria-live="polite">
      <div
        className={cn(
          "lux-toast-success text-center shadow-[0_12px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/10",
          type === "success" && "border-lux-cyan/45",
          type === "error" && "border-red-500/45 text-red-400",
          type === "info" && "border-lux-blue/40 text-lux-text"
        )}
      >
        {message}
      </div>
    </div>,
    document.body
  );
}
