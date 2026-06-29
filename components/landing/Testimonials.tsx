"use client";

import { useScrollReveal } from "./useScrollReveal";

const testimonials = [
  {
    quote: '"We were burning $3,000 a month on LinkedIn Ads and getting maybe 40 replies. InMailly sent 5,000 messages in two weeks and we got 380 conversations. The math is insane."',
    name: "Amir K.",
    title: "Founder, B2B SaaS startup",
    initials: "AK",
    gradient: "from-indigo to-cyan",
  },
  {
    quote: '"I\'ve tried Expandi, Dux-Soup, every LinkedIn tool. InMailly is different — real humans, no restrictions, no account bans. My pipeline went from dry to full in 3 weeks."',
    name: "Sofia R.",
    title: "VP Sales, Enterprise tech",
    initials: "SR",
    gradient: "from-violet-600 to-fuchsia-400",
  },
  {
    quote: '"The dashboard is clean, the team is responsive, and I can see every reply logged in real time. It feels like having 10 SDRs without the payroll. Genuinely surprised how well this works."',
    name: "Marcus W.",
    title: "Growth Lead, Series A startup",
    initials: "MW",
    gradient: "from-sky-500 to-emerald-500",
  },
];

export default function Testimonials() {
  const ref = useScrollReveal();

  return (
    <section className="relative z-[1] py-[100px] px-5 lg:px-10 bg-bg2">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-cyan2 mb-3">
          <span className="w-5 h-px bg-cyan2" />
          Results
        </div>
        <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight leading-tight mb-14">
          What our clients say.
        </h2>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              data-reveal
              data-reveal-idx={i}
              className="opacity-0 translate-y-6 bg-card border border-border rounded-3xl p-7 hover:border-indigo/35 hover:-translate-y-1 transition-all"
            >
              <div className="text-amber-400 text-sm tracking-widest mb-4">★★★★★</div>
              <p className="text-[0.88rem] leading-relaxed text-white/75 italic mb-5">
                {t.quote}
              </p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br ${t.gradient} flex items-center justify-center text-[0.85rem] font-extrabold flex-shrink-0`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-[0.82rem] font-semibold">{t.name}</div>
                  <div className="text-[0.72rem] text-dimmer mt-0.5">{t.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
