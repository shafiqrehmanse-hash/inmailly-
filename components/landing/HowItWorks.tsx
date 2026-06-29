const steps = [
  { n: 1, title: "Place your order", desc: "Pick your send volume and share your target audience — or let us define it. Signup takes under 2 minutes." },
  { n: 2, title: "Team gets assigned", desc: "Admin allocates your LinkedIn profile URLs to our outreach team. Each link uniquely claimed — no overlaps, ever." },
  { n: 3, title: "Outreach goes live", desc: "Real operators send personalized InMails via genuine LinkedIn profiles. Replies land directly in your dashboard." },
  { n: 4, title: "You close the deals", desc: "Track every reply, schedule follow-ups, log deals — all inside your InMailly workspace. We handle the volume." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-[100px] px-5 lg:px-12 bg-off">
      <div className="max-w-[1100px] mx-auto text-center mb-14">
        <div className="section-kicker justify-center">Process</div>
        <h2 className="section-title mt-3">From order to inbox in 48 hours.</h2>
      </div>

      <div className="relative max-w-[1000px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="hidden lg:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-ind to-sky opacity-30" />
        {steps.map((s) => (
          <div key={s.n} className="relative z-[1] text-center">
            <div className="w-14 h-14 rounded-full border-2 border-line2 bg-white flex items-center justify-center mx-auto mb-5 font-bricolage font-extrabold text-lg text-ind shadow-[0_0_0_6px_rgba(67,56,202,.06),0_0_0_12px_rgba(67,56,202,.03)]">
              {s.n}
            </div>
            <div className="font-bricolage font-bold text-[0.93rem] text-ink mb-2">{s.title}</div>
            <p className="text-[0.78rem] text-mid leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
