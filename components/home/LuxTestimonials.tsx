"use client";

import { motion } from "framer-motion";
import type { TestimonialsContent } from "@/lib/site-content-defaults";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";

export default function LuxTestimonials({ content }: { content?: TestimonialsContent }) {
  const c = content ?? DEFAULT_SITE_CONTENT.testimonials;

  return (
    <section className="relative py-32 lg:py-40 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-16">
          {c.sectionLabel}
        </p>

        <div className="space-y-24">
          {c.items.map((q, i) => (
            <motion.blockquote
              key={q.name}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9 }}
              className={`grid lg:grid-cols-[1fr_auto] gap-10 items-end ${
                i % 2 === 1 ? "lg:text-right" : ""
              }`}
            >
              <div>
                <p className="font-bricolage font-extrabold text-[clamp(1.5rem,3.5vw,2.5rem)] leading-snug text-lux-text">
                  &ldquo;{q.quote}&rdquo;
                </p>
              </div>
              <div className={`flex items-center gap-4 ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                <div className="w-14 h-14 border border-lux-blue/30 bg-lux-blue/10 flex items-center justify-center font-bricolage font-extrabold text-lux-cyan">
                  {q.initials}
                </div>
                <div>
                  <div className="font-semibold text-lux-text">{q.name}</div>
                  <div className="text-sm text-lux-muted">
                    {q.role} · {q.company}
                  </div>
                </div>
              </div>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
