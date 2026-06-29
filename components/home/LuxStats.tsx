"use client";

import { motion } from "framer-motion";
import type { StatsContent } from "@/lib/site-content-defaults";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import AnimatedCounter from "./AnimatedCounter";

export default function LuxStats({ content }: { content?: StatsContent }) {
  const c = content ?? DEFAULT_SITE_CONTENT.stats;

  return (
    <section className="relative py-32 lg:py-40 border-t border-white/[0.04] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-lux-blue/[0.03] via-transparent to-lux-violet/[0.03]" />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6 text-center"
        >
          {c.sectionLabel}
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] border border-white/[0.06]">
          {c.items.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className="bg-lux-bg2 p-8 lg:p-10 text-center group hover:bg-lux-card transition-colors duration-500"
            >
              <div className="font-bricolage font-extrabold text-4xl lg:text-5xl text-lux-text tabular-nums">
                <AnimatedCounter
                  value={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  decimals={s.decimals}
                />
              </div>
              <div className="text-[0.7rem] uppercase tracking-[0.15em] text-lux-muted mt-3">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 border border-white/[0.06] bg-lux-card/50 p-4 overflow-hidden"
        >
          <div className="flex gap-8 animate-[scroll_30s_linear_infinite] whitespace-nowrap">
            {[...Array(2)].map((_, gi) => (
              <div key={gi} className="flex gap-8">
                {c.ticker.map((t) => (
                  <span key={`${gi}-${t}`} className="text-[0.75rem] text-lux-muted font-medium">
                    <span className="text-lux-cyan mr-2">●</span>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
