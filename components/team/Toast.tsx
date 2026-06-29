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
        "fixed bottom-6 right-6 z-[300] px-5 py-3 rounded-xl bg-card border text-sm font-medium animate-slide-up shadow-lg",
        type === "success" && "border-indigo/50",
        type === "error" && "border-red-500/50 text-red-300",
        type === "info" && "border-cyan/40"
      )}
    >
      {message}
    </div>,
    document.body
  );
}
