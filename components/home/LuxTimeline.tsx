"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    num: "01",
    title: "Upload targets",
    desc: "Share your ideal customer profiles or let us build the list.",
  },
  {
    num: "02",
    title: "Team assigned",
    desc: "Dedicated operators claim profiles from your private link pool.",
  },
  {
    num: "03",
    title: "Outreach live",
    desc: "Personalized InMails sent by real humans — no bots, no bans.",
  },
  {
    num: "04",
    title: "You close",
    desc: "Every reply tracked. Every conversation logged. Deals in your pipeline.",
  },
];

export default function LuxTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section id="how" className="relative py-32 lg:py-40 border-t border-white/[0.04] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6"
        >
          How it works
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-bricolage font-extrabold text-[clamp(2.2rem,5vw,4rem)] leading-[1.05] text-lux-text max-w-3xl mb-20"
        >
          From upload to inbox in 48 hours.
        </motion.h2>

        <div ref={ref} className="relative grid lg:grid-cols-2 gap-0">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06] -translate-x-1/2">
            <motion.div
              className="w-full bg-gradient-to-b from-lux-blue via-lux-cyan to-lux-violet origin-top"
              style={{ height: lineHeight }}
            />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className={`py-12 lg:py-16 ${i % 2 === 0 ? "lg:pr-20" : "lg:pl-20 lg:col-start-2"}`}
            >
              <div className="group">
                <span className="font-bricolage font-extrabold text-[5rem] lg:text-[7rem] leading-none text-white/[0.04] group-hover:text-lux-blue/20 transition-colors duration-700">
                  {step.num}
                </span>
                <h3 className="font-bricolage font-extrabold text-2xl lg:text-3xl text-lux-text -mt-8 lg:-mt-12">
                  {step.title}
                </h3>
                <p className="text-lux-muted mt-4 max-w-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
