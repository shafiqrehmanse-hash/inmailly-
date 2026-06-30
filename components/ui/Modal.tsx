"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export default function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative lux-modal-panel w-full max-h-[90vh] overflow-y-auto z-10 animate-slide-up",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
            <h2 className="font-bricolage font-extrabold text-lg text-lux-text">{title}</h2>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.05] text-lux-muted hover:text-lux-text hover:border-lux-cyan/30 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-6 text-lux-text">{children}</div>
      </div>
    </div>,
    document.body
  );
}
