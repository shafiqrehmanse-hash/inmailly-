"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { HiPlus } from "react-icons/hi2";

const FAQS = [
  {
    q: "Is this LinkedIn automation?",
    a: "No. InMailly is human-operated outreach infrastructure. Real operators on real profiles — no bots, no browser extensions, no account risk.",
  },
  {
    q: "How fast can we launch?",
    a: "Most campaigns go live within 48 hours of onboarding. Upload your targets, we assign operators, outreach begins.",
  },
  {
    q: "How do you prevent duplicate outreach?",
    a: "Every URL is fingerprinted and deduplicated. If two operators try to claim the same profile, the system blocks it instantly.",
  },
  {
    q: "Who is this for?",
    a: "SaaS founders, agencies, recruiters, lead gen companies, and B2B sales teams who need scale without LinkedIn's per-message pricing.",
  },
  {
    q: "Do I get a dashboard?",
    a: "You receive full visibility into replies, pipeline status, and conversation history. Your team operates on our infrastructure — you see the results.",
  },
];

export default function LuxFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-32 lg:py-40 border-t border-white/[0.04]">
      <div className="max-w-[900px] mx-auto px-6 lg:px-10">
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6">
          FAQ
        </p>
        <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] text-lux-text mb-16">
          Questions, answered.
        </h2>

        <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
          {FAQS.map((faq, i) => (
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
