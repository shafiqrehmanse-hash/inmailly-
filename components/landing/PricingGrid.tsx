"use client";

import Link from "next/link";
import { useScrollReveal } from "./useScrollReveal";

const plans = [
  {
    tier: "Starter",
    volume: "1,000 sends",
    price: "275",
    perUnit: "$0.275 per message",
    feats: ["1,000 LinkedIn InMails", "Reply tracking dashboard", "Lead pipeline included", "7-day delivery window", "Team member assigned"],
    featured: false,
    cta: "Get started",
  },
  {
    tier: "Growth",
    volume: "5,000 sends",
    price: "1,100",
    perUnit: "$0.22 per message — save 20%",
    feats: ["5,000 LinkedIn InMails", "Everything in Starter", "Priority team assignment", "Custom message templates", "Weekly campaign reports", "A/B headline testing"],
    featured: true,
    cta: "Get started",
  },
  {
    tier: "Scale",
    volume: "20,000 sends",
    price: "3,800",
    perUnit: "$0.19 per message — save 31%",
    feats: ["20,000 LinkedIn InMails", "Everything in Growth", "Multiple team members", "Industry-specific targeting", "Duplicate URL protection", "Dedicated account manager"],
    featured: false,
    cta: "Get started",
  },
  {
    tier: "Enterprise",
    volume: "50,000 sends",
    price: "Custom",
    perUnit: "Volume discounts — talk to us",
    feats: ["50,000+ LinkedIn InMails", "Everything in Scale", "White-label reporting", "Custom SLA agreement", "API integrations", "Dedicated infrastructure"],
    featured: false,
    custom: true,
    cta: "Contact us",
  },
];

export default function PricingGrid() {
  const ref = useScrollReveal();

  return (
    <section id="pricing" className="py-[100px] px-5 lg:px-12 bg-off">
      <div className="max-w-[1100px] mx-auto mb-14">
        <div className="section-kicker">Pricing</div>
        <h2 className="section-title mt-3">
          Scale your outreach.
          <br />
          Not your budget.
        </h2>
        <p className="text-[0.95rem] text-mid leading-relaxed max-w-[500px] mt-3">
          Every plan includes human-operated delivery, reply tracking, and a built-in lead dashboard. No setup fees.
        </p>
      </div>

      <div ref={ref} className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan, i) => (
          <div
            key={plan.tier}
            data-reveal
            data-reveal-idx={i}
            className={`opacity-0 translate-y-6 relative bg-white border-[1.5px] rounded-[20px] p-7 flex flex-col transition-all hover:border-ind hover:shadow-card2 hover:-translate-y-1 ${
              plan.featured ? "border-ind shadow-card2" : "border-line"
            }`}
          >
            {plan.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ind text-white text-[0.62rem] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                Most popular
              </div>
            )}
            <div className="text-[0.62rem] font-bold uppercase tracking-widest text-dimmer mb-4">
              {plan.tier}
            </div>
            <div className="font-bricolage font-extrabold text-2xl text-ind tracking-tight">
              {plan.volume}
            </div>
            <div className="flex items-end gap-1 mt-2 mb-1">
              {!plan.custom && <span className="text-sm font-bold text-dim leading-8">$</span>}
              <span className={`font-bricolage font-extrabold tracking-tight text-ink ${plan.custom ? "text-3xl" : "text-[2.4rem] leading-none"}`}>
                {plan.price}
              </span>
            </div>
            <div className="text-[0.72rem] text-dimmer mb-6">{plan.perUnit}</div>
            <div className="h-px bg-line mb-5" />
            <ul className="flex flex-col gap-2.5 text-[0.8rem] text-mid flex-1 mb-6 list-none">
              {plan.feats.map((f) => (
                <li key={f} className="flex items-start gap-2 leading-snug">
                  <span className="w-3 h-3 mt-0.5 rounded-full bg-green-l border border-green/25 flex-shrink-0 flex items-center justify-center text-[0.45rem] text-green">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`block py-2.5 rounded-[10px] text-center text-[0.82rem] font-bold transition-all ${
                plan.featured
                  ? "bg-ind text-white border border-ind shadow-[0_4px_14px_rgba(67,56,202,.3)] hover:bg-ind2"
                  : "border-[1.5px] border-line2 text-mid hover:border-ind hover:text-ind hover:bg-ind-light"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
