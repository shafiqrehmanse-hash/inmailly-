"use client";

import { useScrollReveal } from "./useScrollReveal";

const features = [
  { icon: "⛓", title: "Link Pool & Claim System", desc: "Admin drops hundreds of LinkedIn URLs into the pool. Each team member claims, works, and marks done. Zero duplicate outreach — auto-detected by URL fingerprint." },
  { icon: "◫", title: "Lead Pipeline Dashboard", desc: "Every reply becomes a lead card. Log follow-ups, InMails, notes, and track deals from new → interested → closed. Full conversation history per lead." },
  { icon: "🔒", title: "Duplicate URL Protection", desc: "Smart URL fingerprinting ensures no two operators ever contact the same LinkedIn profile. The same /in/ slug from different URL formats is caught and blocked." },
  { icon: "📊", title: "Admin Control Panel", desc: "Paste 500 links at once — see new vs duplicates before import. Track every member's performance, links worked, leads added, and deals closed live." },
  { icon: "✦", title: "Referral & Earnings Tracker", desc: "Team members earn when clients they refer convert. Track referral codes, credit history, and total PKR earnings — all inside one clean dashboard." },
  { icon: "💬", title: "Full Conversation Log", desc: "Every message type logged — InMail, follow-up, reply, cold message, or internal note. See what was said, when, and by whom. Nothing falls through the cracks." },
];

export default function FeatureGrid() {
  const ref = useScrollReveal();

  return (
    <section id="features" className="py-[100px] px-5 lg:px-12 bg-white">
      <div className="max-w-[1100px] mx-auto mb-14">
        <div className="section-kicker">Features</div>
        <h2 className="section-title mt-3">
          Everything your team needs.
          <br />
          Nothing they don&apos;t.
        </h2>
        <p className="text-[0.95rem] text-mid leading-relaxed max-w-[500px] mt-3">
          Built for outreach teams who need speed, visibility, and control — without enterprise complexity.
        </p>
      </div>

      <div ref={ref} className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <div
            key={f.title}
            data-reveal
            data-reveal-idx={i}
            className="opacity-0 translate-y-6 bg-white border-[1.5px] border-line rounded-[20px] p-7 hover:border-ind/30 hover:shadow-card2 hover:-translate-y-0.5 transition-all"
          >
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl mb-4 bg-ind-light">
              {f.icon}
            </div>
            <div className="font-bricolage font-bold text-[1.05rem] tracking-tight text-ink mb-2.5">
              {f.title}
            </div>
            <p className="text-[0.82rem] text-mid leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
