"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const PANELS = [
  {
    tag: "Command center",
    title: "Every reply. One surface.",
    desc: "Live pipeline, conversation history, and deal status — without switching tools.",
    metric: "9 leads",
    metricLabel: "Active today",
  },
  {
    tag: "Link intelligence",
    title: "Zero duplicate outreach.",
    desc: "Smart URL fingerprinting ensures no two operators contact the same profile.",
    metric: "100%",
    metricLabel: "Dedup accuracy",
  },
  {
    tag: "Scale layer",
    title: "Thousands of profiles. One upload.",
    desc: "Drop your target list. Our team claims, messages, and tracks at enterprise velocity.",
    metric: "50k+",
    metricLabel: "Profiles / month",
  },
];

export default function ProductShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0.92, 1, 0.96]);
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section id="product" ref={ref} className="relative py-32 lg:py-48 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-20 max-w-2xl"
        >
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6">
            The platform
          </p>
          <h2 className="font-bricolage font-extrabold text-[clamp(2.2rem,5vw,4rem)] leading-[1.05] text-lux-text">
            Built like infrastructure. Not a plugin.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="lg:sticky lg:top-32 space-y-16">
            {PANELS.map((p, i) => (
              <motion.div
                key={p.tag}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
              >
                <span className="text-[0.65rem] uppercase tracking-[0.2em] text-lux-blue font-semibold">
                  {p.tag}
                </span>
                <h3 className="font-bricolage font-extrabold text-3xl lg:text-4xl text-lux-text mt-3 leading-tight">
                  {p.title}
                </h3>
                <p className="text-lux-muted mt-4 leading-relaxed max-w-md">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div style={{ scale, y }} className="relative">
            <div className="absolute -inset-8 bg-lux-blue/10 blur-3xl" />
            <div className="relative border border-white/[0.08] bg-lux-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center">
                <span className="text-[0.65rem] uppercase tracking-wider text-lux-muted">InMailly OS</span>
                <span className="text-[0.65rem] text-lux-cyan">v3.0</span>
              </div>
              {PANELS.map((p, i) => (
                <motion.div
                  key={p.tag}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="p-6 border-b border-white/[0.06] last:border-0 hover:bg-lux-bg2/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-lux-muted uppercase tracking-wider">{p.tag}</div>
                      <div className="font-semibold text-lux-text mt-1">{p.title}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bricolage font-extrabold text-2xl text-lux-cyan">{p.metric}</div>
                      <div className="text-[0.6rem] text-lux-muted uppercase">{p.metricLabel}</div>
                    </div>
                  </div>
                  <div className="mt-4 h-1 bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-lux-blue to-lux-cyan"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${70 + i * 10}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
