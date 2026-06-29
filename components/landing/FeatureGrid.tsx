"use client";

import { useScrollReveal } from "./useScrollReveal";

const features = [
  { icon: "⛓", title: "Link Pool & Claim System", desc: "Admin drops hundreds of LinkedIn URLs into the pool. Each team member claims, works, and marks done. Zero duplicates — ever. Auto-detects LinkedIn vs Sales Navigator vs general links." },
  { icon: "◫", title: "Lead Pipeline Dashboard", desc: "Every reply becomes a lead card. Log follow-ups, InMails, notes, and track deal status from new → interested → closed. Full conversation history per lead, organized and searchable." },
  { icon: "🔒", title: "Duplicate URL Protection", desc: "Smart URL fingerprinting ensures no two operators ever contact the same LinkedIn profile. The same /in/ slug from different URLs is recognized and blocked automatically." },
  { icon: "📊", title: "Admin Control Panel", desc: "Paste 500 links at once and see exactly how many are new vs duplicates before import. Track every member's performance, links worked, leads added, and deals closed in real time." },
  { icon: "✦", title: "Referral & Earnings Tracker", desc: "Team members earn when clients they refer convert. Track referral codes, credit history, total PKR earnings, and payout records — all inside one clean dashboard." },
  { icon: "💬", title: "Full Conversation Log", desc: "Every message type logged — InMail, follow-up, reply, cold message, or internal note. See what was said, when, and by whom. Nothing falls through the cracks." },
];

export default function FeatureGrid() {
  const ref = useScrollReveal();

  return (
    <section id="features" className="relative z-[1] py-[100px] px-5 lg:px-10 bg-bg">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-cyan2 mb-3">
          <span className="w-5 h-px bg-cyan2" />
          Features
        </div>
        <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight leading-tight mb-4">
          Everything you need.
          <br />
          Nothing you don&apos;t.
        </h2>
        <p className="text-[0.95rem] text-dim leading-relaxed max-w-[520px]">
          Built from the ground up for outreach teams who need speed, visibility, and control — without enterprise complexity.
        </p>

        <div
          ref={ref}
          className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-3xl overflow-hidden"
        >
          {features.map((f, i) => (
            <div
              key={f.title}
              data-reveal
              data-reveal-idx={i}
              className="opacity-0 translate-y-6 bg-card p-7 hover:bg-card2 transition-colors"
            >
              <div className="w-12 h-12 rounded-[13px] flex items-center justify-center text-xl mb-5 bg-indigo/10 border border-indigo/20">
                {f.icon}
              </div>
              <div className="font-bricolage font-bold text-[1.05rem] tracking-tight mb-2.5">
                {f.title}
              </div>
              <p className="text-[0.82rem] text-dim leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
