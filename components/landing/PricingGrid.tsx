"use client";

import Link from "next/link";
import { useScrollReveal } from "./useScrollReveal";

const plans = [
  {
    tier: "Starter",
    volume: "1,000 sends",
    price: "275",
    perUnit: "$0.275 per message",
    feats: [
      "1,000 LinkedIn InMails",
      "Reply tracking dashboard",
      "Lead pipeline access",
      "7-day delivery window",
      "Team member assigned",
    ],
    featured: false,
  },
  {
    tier: "Growth",
    volume: "5,000 sends",
    price: "1,100",
    perUnit: "$0.22 per message — save 20%",
    feats: [
      "5,000 LinkedIn InMails",
      "Everything in Starter",
      "Priority team assignment",
      "Custom message templates",
      "Weekly campaign reports",
      "A/B headline testing",
    ],
    featured: true,
  },
  {
    tier: "Scale",
    volume: "20,000 sends",
    price: "3,800",
    perUnit: "$0.19 per message — save 31%",
    feats: [
      "20,000 LinkedIn InMails",
      "Everything in Growth",
      "Multiple team members",
      "Industry-specific targeting",
      "Duplicate URL protection",
      "Dedicated account manager",
    ],
    featured: false,
  },
  {
    tier: "Enterprise",
    volume: "50,000 sends",
    price: "Custom",
    perUnit: "Volume discounts — talk to us",
    feats: [
      "50,000+ LinkedIn InMails",
      "Everything in Scale",
      "Custom SLA agreement",
      "White-label reporting",
      "API integrations",
      "Dedicated infrastructure",
    ],
    featured: false,
    custom: true,
  },
];

export default function PricingGrid() {
  const ref = useScrollReveal();

  return (
    <section id="pricing" className="relative z-[1] py-[100px] px-5 lg:px-10 bg-bg2">
      <div className="max-w-[1100px] mx-auto">
        <div className="s-kicker flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-cyan2 mb-3">
          <span className="w-5 h-px bg-cyan2" />
          Pricing
        </div>
        <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight leading-tight mb-4">
          Scale your outreach.
          <br />
          Not your budget.
        </h2>
        <p className="text-[0.95rem] text-dim leading-relaxed max-w-[520px]">
          Every plan includes human-operated delivery, real reply tracking, and a built-in lead dashboard. No hidden fees.
        </p>

        <div
          ref={ref}
          className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-3xl overflow-hidden"
        >
          {plans.map((plan, i) => (
            <div
              key={plan.tier}
              data-reveal
              data-reveal-idx={i}
              className={`opacity-0 translate-y-6 bg-card p-7 flex flex-col relative hover:bg-card2 transition-colors ${
                plan.featured
                  ? "bg-gradient-to-b from-indigo/[0.12] to-card hover:from-indigo/[0.18]"
                  : ""
              }`}
            >
              {plan.featured && (
                <>
                  <div className="absolute inset-[-1px] border border-indigo/50 pointer-events-none" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo to-indigo2 text-white text-[0.62rem] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_4px_16px_rgba(79,70,229,0.4)] whitespace-nowrap">
                    Most popular
                  </div>
                </>
              )}
              <div className="text-[0.62rem] font-bold uppercase tracking-widest text-dimmer mb-5">
                {plan.tier}
              </div>
              <div className="font-bricolage font-extrabold text-2xl tracking-tight bg-gradient-to-br from-indigo2 to-cyan bg-clip-text text-transparent mb-1">
                {plan.volume}
              </div>
              <div className="flex items-end gap-1 mt-2 mb-1">
                {!plan.custom && <span className="font-bricolage font-bold text-dim">$</span>}
                <span className={`font-bricolage font-extrabold tracking-tight ${plan.custom ? "text-3xl" : "text-[2.6rem] leading-none"}`}>
                  {plan.price}
                </span>
              </div>
              <div className="text-[0.72rem] text-dimmer mb-7">{plan.perUnit}</div>
              <div className="h-px bg-white/[0.06] mb-5" />
              <ul className="flex flex-col gap-2.5 text-[0.8rem] text-white/60 flex-1 mb-7 list-none">
                {plan.feats.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="w-3.5 h-3.5 rounded-full bg-green-500/15 border border-green-500/40 flex-shrink-0 mt-0.5 flex items-center justify-center text-[0.5rem] text-green-400">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block py-3 rounded-[10px] text-center text-[0.82rem] font-bold transition-all ${
                  plan.featured
                    ? "bg-gradient-to-br from-indigo to-indigo2 text-white shadow-[0_4px_16px_rgba(79,70,229,0.35)] hover:-translate-y-px"
                    : "border border-white/10 text-white/60 bg-white/[0.04] hover:border-white/25 hover:text-white"
                }`}
              >
                {plan.custom ? "Contact us" : "Get started"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
