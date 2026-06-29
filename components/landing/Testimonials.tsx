"use client";

import { useScrollReveal } from "./useScrollReveal";

const testimonials = [
  { quote: "We were burning $3,000 a month on LinkedIn Ads and getting maybe 40 replies. InMailly sent 5,000 messages in two weeks and we got 380 conversations. The math is insane.", name: "Amir K.", title: "Founder, B2B SaaS startup", initials: "AK", gradient: "from-ind to-sky" },
  { quote: "I've tried Expandi, Dux-Soup, every LinkedIn tool. InMailly is different — real humans, no restrictions, no account bans. My pipeline went from dry to full in 3 weeks.", name: "Sofia R.", title: "VP Sales, Enterprise tech", initials: "SR", gradient: "from-violet-600 to-fuchsia-400" },
  { quote: "The dashboard is clean, the team is responsive, and I can see every reply logged in real time. It feels like having 10 SDRs without the payroll.", name: "Marcus W.", title: "Growth Lead, Series A startup", initials: "MW", gradient: "from-sky-500 to-emerald-500" },
];

export default function Testimonials() {
  const ref = useScrollReveal();

  return (
    <section className="py-[100px] px-5 lg:px-12 bg-off">
      <div className="max-w-[1100px] mx-auto mb-14">
        <div className="section-kicker">Results</div>
        <h2 className="section-title mt-3">What our clients say.</h2>
      </div>

      <div ref={ref} className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
        {testimonials.map((t, i) => (
          <div
            key={t.name}
            data-reveal
            data-reveal-idx={i}
            className="opacity-0 translate-y-6 bg-white border-[1.5px] border-line rounded-[20px] p-7 hover:border-ind/25 hover:shadow-card hover:-translate-y-0.5 transition-all"
          >
            <div className="text-amber-400 text-sm tracking-widest mb-3">★★★★★</div>
            <p className="relative text-[0.88rem] leading-relaxed text-mid mb-5 pt-5">
              <span className="absolute -top-2 -left-1 font-bricolage text-5xl font-extrabold text-ind-light leading-none">&ldquo;</span>
              {t.quote}
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[11px] bg-gradient-to-br ${t.gradient} flex items-center justify-center text-sm font-extrabold text-white`}>
                {t.initials}
              </div>
              <div>
                <div className="text-[0.83rem] font-bold text-ink">{t.name}</div>
                <div className="text-[0.72rem] text-dimmer">{t.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
