import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="relative z-[1] py-[100px] px-5 lg:px-10 bg-bg">
      <div className="max-w-[800px] mx-auto bg-card2 border border-indigo/25 rounded-[32px] px-8 lg:px-16 py-16 lg:py-[72px] text-center relative overflow-hidden">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[radial-gradient(ellipse,rgba(79,70,229,0.2)_0%,rgba(6,182,212,0.08)_50%,transparent_70%)] pointer-events-none" />
        <div className="relative z-[1] inline-block px-3.5 py-1.5 rounded-full border border-cyan/30 bg-cyan/[0.06] text-[0.68rem] font-bold tracking-widest uppercase text-cyan2 mb-6">
          Get started today
        </div>
        <h2 className="relative z-[1] font-bricolage font-extrabold text-[clamp(2rem,4vw,3rem)] tracking-tight leading-tight mb-4">
          Stop paying $6.67 per message.
          <br />
          Start at $275 for 1,000.
        </h2>
        <p className="relative z-[1] text-[0.92rem] text-dim leading-relaxed max-w-[460px] mx-auto mb-9">
          Join growth teams who&apos;ve switched from LinkedIn Ads to real human outreach at scale. Setup in 48 hours.
        </p>
        <div className="relative z-[1] flex gap-3 justify-center flex-wrap">
          <Link
            href="/register"
            className="px-8 py-4 rounded-xl text-[0.95rem] font-bold text-white bg-gradient-to-br from-indigo to-indigo2 shadow-[0_8px_32px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Launch your campaign →
          </Link>
          <a
            href="mailto:hello@inmailly.com"
            className="px-7 py-4 rounded-xl text-[0.95rem] font-semibold text-dim bg-white/[0.04] border border-white/10 hover:text-white hover:border-white/[0.22] transition-all"
          >
            Talk to us first
          </a>
        </div>
      </div>
    </section>
  );
}
