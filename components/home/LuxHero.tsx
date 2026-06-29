"use client";

import { motion } from "framer-motion";
import { HiShieldCheck } from "react-icons/hi2";
import HeroDashboard from "./HeroDashboard";
import MagneticButton from "./MagneticButton";
import { fadeUp } from "./motion";

const TRUST = [
  "Verified LinkedIn accounts",
  "Sales Nav activated",
  "200 InMails free trial",
  "You provide audience + script",
];

export default function LuxHero() {
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
                200 InMails free · No card required
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="font-bricolage font-extrabold text-[clamp(2.8rem,7.5vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-lux-text"
            >
              Outreach
              <br />
              infrastructure
              <br />
              <span className="bg-gradient-to-r from-lux-blue via-lux-cyan to-lux-violet bg-clip-text text-transparent">
                at scale.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-8 text-lg lg:text-xl text-lux-muted max-w-lg leading-relaxed font-light"
            >
              Send us your target audience and InMail script. We deliver on verified, established
              LinkedIn profiles with Sales Navigator — powered by our internal software.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <MagneticButton href="/contact">Claim 200 free InMails</MagneticButton>
              <MagneticButton href="/client" variant="ghost">
                Open client dashboard
              </MagneticButton>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="mt-12 flex flex-wrap gap-3"
            >
              {TRUST.map((t) => (
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
                <div className="font-bricolage font-extrabold text-3xl text-lux-text">200</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">Free trial InMails</div>
              </div>
              <div className="w-px h-10 bg-white/[0.08]" />
              <div>
                <div className="font-bricolage font-extrabold text-3xl text-lux-text">$2.00</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">LinkedIn cost / InMail</div>
              </div>
              <div className="w-px h-10 bg-white/[0.08] hidden sm:block" />
              <div className="hidden sm:block">
                <div className="font-bricolage font-extrabold text-3xl text-lux-cyan">$0.27</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">InMailly after trial</div>
              </div>
            </motion.div>
          </div>

          <HeroDashboard />
        </div>
      </div>
    </section>
  );
}
