"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { fadeUp } from "./motion";

const LINKEDIN = {
  title: "LinkedIn Sales Navigator",
  subtitle: "$100/mo · 50 InMail credits included",
  rows: [
    { label: "Monthly cost", value: "$100", bad: true },
    { label: "InMail credits", value: "50 / month", bad: true },
    { label: "Cost per InMail", value: "$2.00", bad: true },
    { label: "Accounts used", value: "Your profile only", bad: true },
    { label: "Reply dashboard", value: "Not included", bad: true },
    { label: "Human delivery", value: "You send manually", bad: true },
  ],
};

const INMAILLY = {
  title: "InMailly",
  subtitle: "Verified Sales Nav · Human-operated infrastructure",
  rows: [
    { label: "Free trial", value: "200 InMails", bad: false },
    { label: "You provide", value: "Audience + script", bad: false },
    { label: "We deliver via", value: "Verified Sales Nav profiles", bad: false },
    { label: "Paid from", value: "$0.27 / InMail", bad: false },
    { label: "Client dashboard", value: "Full live tracking", bad: false },
    { label: "Setup", value: "48 hours", bad: false },
  ],
};

export default function ProblemStory() {
  const [side, setSide] = useState<"linkedin" | "inmailly">("linkedin");
  const data = side === "linkedin" ? LINKEDIN : INMAILLY;

  return (
    <section id="story" className="relative py-32 lg:py-40 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6">
              The math
            </p>
            <h2 className="font-bricolage font-extrabold text-[clamp(2.2rem,5vw,4rem)] leading-[1.05] tracking-tight text-lux-text">
              $100 gets you 50 InMails on LinkedIn.
            </h2>
            <p className="mt-6 text-lg text-lux-muted leading-relaxed max-w-md">
              Sales Navigator gives 50 credits a month. That&apos;s $2 per message — from your own
              account, with no pipeline, no team, and no scale. We run verified Sales Nav profiles
              with our internal software. You send us your target audience and script.
            </p>

            <div className="mt-10 flex border border-white/[0.08] p-1 w-fit">
              {(["linkedin", "inmailly"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`px-6 py-2.5 text-[0.75rem] font-semibold uppercase tracking-wider transition-all ${
                    side === s ? "bg-lux-blue text-white" : "text-lux-muted hover:text-lux-text"
                  }`}
                >
                  {s === "linkedin" ? "LinkedIn" : "InMailly"}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div
              className={`absolute -inset-px bg-gradient-to-br ${
                side === "linkedin"
                  ? "from-red-500/20 to-transparent"
                  : "from-lux-blue/30 via-lux-cyan/10 to-lux-violet/20"
              } transition-all duration-700`}
            />
            <div className="relative border border-white/[0.08] bg-lux-card p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={side}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="mb-8">
                    <h3 className="font-bricolage font-extrabold text-2xl text-lux-text">{data.title}</h3>
                    <p className="text-sm text-lux-muted mt-1">{data.subtitle}</p>
                  </div>
                  <div className="space-y-0">
                    {data.rows.map((row, i) => (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center justify-between py-4 border-b border-white/[0.06] last:border-0"
                      >
                        <span className="text-sm text-lux-muted">{row.label}</span>
                        <span
                          className={`font-bricolage font-bold text-lg text-right max-w-[55%] ${
                            row.bad ? "text-red-400" : "text-lux-cyan"
                          }`}
                        >
                          {row.value}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {side === "inmailly" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 pt-6 border-t border-lux-cyan/20 text-center"
                >
                  <span className="text-sm font-semibold text-lux-cyan">
                    Start free — 200 InMails. Pay only when you love the results.
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
