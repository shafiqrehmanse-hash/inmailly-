"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import MagneticButton from "./MagneticButton";

const PLANS = [
  {
    name: "Free trial",
    price: "0",
    unit: "200 InMails",
    per: "No credit card · Full dashboard",
    featured: true,
    trial: true,
  },
  {
    name: "Starter",
    price: "275",
    unit: "1,000 messages",
    per: "$0.27/msg after trial",
    featured: false,
  },
  {
    name: "Growth",
    price: "1,100",
    unit: "5,000 messages",
    per: "$0.22/msg",
    featured: false,
  },
  {
    name: "Scale",
    price: "3,800",
    unit: "20,000 messages",
    per: "$0.19/msg",
    featured: false,
  },
];

export default function LuxPricing() {
  return (
    <section id="pricing" className="relative py-32 lg:py-48 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6">
              Pricing
            </p>
            <h2 className="font-bricolage font-extrabold text-[clamp(2.2rem,5vw,4rem)] leading-[1.05] text-lux-text max-w-xl">
              Try 200 InMails free. Pay when it works.
            </h2>
          </div>
          <p className="text-lux-muted max-w-sm leading-relaxed">
            Verified Sales Nav profiles. You provide audience + script. We handle delivery and your
            dashboard tracks every reply.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 items-end">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.7 }}
              className={`relative ${plan.featured ? "lg:-mt-8" : ""}`}
            >
              {plan.featured && (
                <div className="absolute -inset-px bg-gradient-to-b from-lux-cyan via-lux-blue/50 to-lux-violet/30" />
              )}
              <div
                className={`relative border bg-lux-card p-8 flex flex-col h-full ${
                  plan.featured
                    ? "border-transparent py-12 shadow-[0_0_60px_rgba(34,211,238,0.12)]"
                    : "border-white/[0.08] hover:border-lux-blue/30"
                }`}
              >
                {plan.featured && (
                  <span className="absolute top-0 left-0 right-0 text-center text-[0.6rem] uppercase tracking-[0.2em] text-lux-cyan font-bold py-2 bg-lux-cyan/10">
                    Start here
                  </span>
                )}
                <div className={plan.featured ? "mt-4" : ""}>
                  <h3 className="font-bricolage font-extrabold text-xl text-lux-text">{plan.name}</h3>
                  <p className="text-[0.7rem] text-lux-muted mt-1 uppercase tracking-wider">{plan.unit}</p>
                </div>
                <div className="my-8">
                  {!plan.trial && <span className="text-sm text-lux-muted">$</span>}
                  <span className="font-bricolage font-extrabold text-4xl lg:text-5xl text-lux-text">
                    {plan.price}
                  </span>
                  <p className="text-sm text-lux-cyan mt-2">{plan.per}</p>
                </div>
                <div className="mt-auto">
                  <Link
                    href="/contact"
                    className={`block text-center py-3 text-[0.8rem] font-semibold uppercase tracking-wider transition-all ${
                      plan.featured
                        ? "bg-lux-cyan text-lux-bg hover:bg-lux-cyan/90"
                        : "border border-white/[0.12] text-lux-text hover:border-lux-cyan/50 hover:text-lux-cyan"
                    }`}
                  >
                    {plan.trial ? "Start free trial" : "Get started"}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <MagneticButton href="/client" variant="ghost">
            Preview client dashboard →
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
