const steps = [
  { n: 1, title: "Place your order", desc: "Pick your send volume, tell us your target audience — or let us define it. Sign up takes under 2 minutes." },
  { n: 2, title: "Team gets assigned", desc: "Admin allocates your LinkedIn profile URLs to our outreach team. Each link uniquely claimed — no overlaps." },
  { n: 3, title: "Outreach goes live", desc: "Real operators send personalized InMails via genuine LinkedIn profiles. Replies land directly in your dashboard." },
  { n: 4, title: "You close the deals", desc: "Track every reply, schedule follow-ups, log deals — all inside your InMailly workspace. We handle the volume, you handle the close." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative z-[1] py-[100px] px-5 lg:px-10 bg-bg2">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="flex items-center justify-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-cyan2 mb-3">
          <span className="w-5 h-px bg-cyan2" />
          Process
        </div>
        <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight leading-tight mb-14">
          From order to inbox
          <br />
          in 48 hours.
        </h2>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          <div className="hidden lg:block absolute top-[30px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo to-cyan opacity-30" />
          {steps.map((s) => (
            <div key={s.n} className="relative z-[1] px-5 text-center">
              <div className="w-[60px] h-[60px] rounded-full border border-border bg-card flex items-center justify-center mx-auto mb-5 font-bricolage font-extrabold text-xl text-indigo2 shadow-[0_0_0_6px_rgba(79,70,229,0.06),0_0_0_12px_rgba(79,70,229,0.03)]">
                {s.n}
              </div>
              <div className="font-bricolage font-bold text-[0.95rem] tracking-tight mb-2.5">
                {s.title}
              </div>
              <p className="text-[0.78rem] text-dim leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
