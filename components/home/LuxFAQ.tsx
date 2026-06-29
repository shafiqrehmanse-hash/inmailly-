"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { HiPlus } from "react-icons/hi2";
import type { FaqContent } from "@/lib/site-content-defaults";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";

export default function LuxFAQ({ content }: { content?: FaqContent }) {
  const c = content ?? DEFAULT_SITE_CONTENT.faq;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-32 lg:py-40 border-t border-white/[0.04]">
      <div className="max-w-[900px] mx-auto px-6 lg:px-10">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6">
          {c.sectionLabel}
        </p>
        <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] text-lux-text mb-16">
          {c.title}
        </h2>

        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {c.items.map((faq, i) => (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left group"
              >
                <span className="font-bricolage font-bold text-lg text-lux-text group-hover:text-lux-cyan transition-colors pr-8">
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="shrink-0 text-lux-muted"
                >
                  <HiPlus className="w-5 h-5" />
                </motion.span>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-lux-muted leading-relaxed max-w-2xl">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
