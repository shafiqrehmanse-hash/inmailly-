"use client";

import { motion } from "framer-motion";
import { HiShieldCheck } from "react-icons/hi2";
import type { HeroContent } from "@/lib/site-content-defaults";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content-defaults";
import HeroDashboard from "./HeroDashboard";
import MagneticButton from "./MagneticButton";
import { fadeUp } from "./motion";

export default function LuxHero({ content }: { content?: HeroContent }) {
  const c = content ?? DEFAULT_SITE_CONTENT.hero;

  return (
    <section className="relative min-h-screen flex items-center pt-[72px] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 w-full py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2.5 border border-lux-cyan/25 bg-lux-cyan/5 px-4 py-2 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-lux-cyan animate-pulse" />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-lux-cyan">
                {c.badge}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="font-bricolage font-extrabold text-[clamp(2.8rem,7.5vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-lux-text"
            >
              {c.titleLine1}
              <br />
              {c.titleLine2}
              <br />
              <span className="bg-gradient-to-r from-lux-blue via-lux-cyan to-lux-violet bg-clip-text text-transparent">
                {c.titleAccent}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-8 text-lg lg:text-xl text-lux-muted max-w-lg leading-relaxed font-light"
            >
              {c.subtitle}
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <MagneticButton href="/client/register">{c.ctaPrimary}</MagneticButton>
              <MagneticButton href="/contact" variant="ghost">
                {c.ctaSecondary}
              </MagneticButton>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="mt-12 flex flex-wrap gap-3"
            >
              {c.trustItems.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 text-[0.7rem] text-lux-muted border border-white/[0.06] px-3 py-1.5"
                >
                  <HiShieldCheck className="w-3.5 h-3.5 text-lux-cyan" />
                  {t}
                </span>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              className="mt-14 flex items-center gap-8 border-t border-white/[0.06] pt-8"
            >
              <div>
                <div className="font-bricolage font-extrabold text-3xl text-lux-text">48h</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">
                  Avg launch time
                </div>
              </div>
              <div className="w-px h-10 bg-white/[0.08]" />
              <div>
                <div className="font-bricolage font-extrabold text-3xl text-lux-text">$2.00</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">
                  LinkedIn cost / InMail
                </div>
              </div>
              <div className="w-px h-10 bg-white/[0.08] hidden sm:block" />
              <div className="hidden sm:block">
                <div className="font-bricolage font-extrabold text-3xl text-lux-cyan">$0.27</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">
                  InMailly per message
                </div>
              </div>
            </motion.div>
          </div>

          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}
