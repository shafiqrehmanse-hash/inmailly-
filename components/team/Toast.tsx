"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export default function Toast({ message, type = "success", onDismiss }: { message: string; type?: ToastType; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return createPortal(
    <div className={cn(
      "fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl bg-white border text-sm font-medium shadow-card animate-slide-up",
      type === "success" && "border-ind/40 text-ink",
      type === "error" && "border-red/40 text-red",
      type === "info" && "border-sky/40 text-ink"
    )}>
      {message}
    </div>,
    document.body
  );
}
