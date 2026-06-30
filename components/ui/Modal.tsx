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
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
  panelClassName?: string;
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative lux-card w-full max-h-[90vh] overflow-y-auto z-10",
          wide ? "max-w-3xl" : "max-w-lg",
          panelClassName
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
            <h2 className="font-bricolage font-extrabold text-lg text-lux-text">{title}</h2>
            <button
              onClick={onClose}
              className="text-lux-muted hover:text-lux-text text-xl leading-none"
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
