"use client";

import { motion } from "framer-motion";
import type { FinalCtaContent } from "@/lib/site-content-defaults";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import MagneticButton from "./MagneticButton";

export default function LuxFinalCTA({ content }: { content?: FinalCtaContent }) {
  const c = content ?? DEFAULT_SITE_CONTENT.finalCta;

  return (
    <section className="relative py-40 lg:py-56 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-lux-blue/20 via-lux-bg to-lux-violet/10" />
      <div className="absolute inset-0 lux-noise opacity-[0.03]" />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-lux-blue/20 blur-[120px] rounded-full"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative max-w-[900px] mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="font-bricolage font-extrabold text-[clamp(2.5rem,6vw,5rem)] leading-[1.05] tracking-tight text-lux-text"
        >
          {c.title}
        </motion.h2>
        {c.subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 text-lux-muted text-lg"
          >
            {c.subtitle}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-12"
        >
          <MagneticButton href="/contact" className="!px-12 !py-4 !text-base">
            {c.cta}
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
