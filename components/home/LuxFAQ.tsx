"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { HiPlus } from "react-icons/hi2";

const FAQS = [
  {
    q: "How does the free trial work?",
    a: "You get 200 InMails free with full dashboard access. Send us your target audience and InMail script. If the results impress you, we move to a paid plan. No credit card to start.",
  },
  {
    q: "What LinkedIn accounts do you use?",
    a: "Verified, established LinkedIn profiles with Sales Navigator activated. Not your personal account — our infrastructure, operated by humans using our internal software.",
  },
  {
    q: "What do I need to provide?",
    a: "Two things: your target audience (profile list or ICP criteria) and your InMail script. We handle delivery, tracking, and reporting.",
  },
  {
    q: "How is this different from Sales Navigator?",
    a: "Sales Navigator costs $100/month for 50 InMail credits — that's $2 per message from your own account. We deliver at $0.27/InMail on verified profiles with a full client dashboard.",
  },
  {
    q: "Can I see replies in real time?",
    a: "Yes. Your client dashboard at /client shows live responses, pipeline stages, and campaign analytics — the same interface previewed on our homepage.",
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
