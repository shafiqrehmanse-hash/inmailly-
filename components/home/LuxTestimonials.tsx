"use client";

import { motion } from "framer-motion";

const QUOTES = [
  {
    quote:
      "We burned $3,000/month on LinkedIn Ads for 40 replies. InMailly sent 5,000 messages and we got 380 conversations. The math is absurd.",
    name: "Amir K.",
    role: "Founder",
    company: "B2B SaaS",
    initials: "AK",
  },
  {
    quote:
      "This isn't another automation tool. Real humans, no restrictions, no bans. My pipeline went from dry to full in three weeks.",
    name: "Sofia R.",
    role: "VP Sales",
    company: "Enterprise Tech",
    initials: "SR",
  },
  {
    quote:
      "Clean operations layer. Every reply logged in real time. It feels like having ten SDRs without the payroll.",
    name: "Marcus W.",
    role: "Growth Lead",
    company: "Series A",
    initials: "MW",
  },
];

export default function LuxTestimonials() {
  return (
    <section className="relative py-32 lg:py-40 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-16">
          What operators say
        </p>

        <div className="space-y-24">
          {QUOTES.map((q, i) => (
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
