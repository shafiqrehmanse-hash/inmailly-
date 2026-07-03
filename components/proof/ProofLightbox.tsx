"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export default function ProofLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={src}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full border border-white/20 bg-lux-bg2/90 text-lux-text text-xl hover:border-lux-cyan/50"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </motion.button>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-6xl w-full max-h-[92vh] overflow-hidden rounded-2xl border border-white/[0.12] shadow-[0_32px_80px_rgba(0,0,0,0.6)] bg-lux-bg2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
            <span className="text-[0.65rem] uppercase tracking-widest text-lux-cyan font-semibold">
              InMail send proof
            </span>
            <span className="text-[0.65rem] text-lux-muted">HD verified capture</span>
          </div>
          <div className="overflow-auto max-h-[calc(90vh-52px)] bg-[#0a0f18]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="w-full h-auto block" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export function ProofThumb({
  src,
  alt,
  onClick,
  className = "",
  size = "sm",
}: {
  src: string;
  alt: string;
  onClick: () => void;
  className?: string;
  /** sm = compact grid (client dashboard), md = campaign manager upload list */
  size?: "sm" | "md";
}) {
  const heightClass = size === "md" ? "h-36 sm:h-40" : "h-24 sm:h-28";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block w-full overflow-hidden rounded-xl border border-white/[0.1] bg-lux-bg2 hover:border-lux-cyan/40 transition-all ${heightClass} ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <span className="absolute bottom-1.5 right-1.5 text-[0.55rem] font-bold uppercase tracking-wider text-white/95 bg-black/55 px-1.5 py-0.5 rounded">
        View HD
      </span>
    </button>
  );
}
