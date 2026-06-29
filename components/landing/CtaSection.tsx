import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="py-[100px] px-5 lg:px-12 bg-white">
      <div className="relative max-w-[780px] mx-auto bg-gradient-to-br from-ind via-ind2 to-[#6d28d9] rounded-[28px] px-8 lg:px-16 py-16 lg:py-[72px] text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative z-[1]">
          <div className="inline-block px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-[0.68rem] font-bold tracking-widest uppercase text-white/90 mb-5">
            Get started today
          </div>
          <h2 className="font-bricolage font-extrabold text-[clamp(1.9rem,4vw,3rem)] tracking-tight text-white leading-tight mb-3">
            Stop paying $6.67 per message.
            <br />
            Start at $275 for 1,000.
          </h2>
          <p className="text-[0.92rem] text-white/70 leading-relaxed max-w-[440px] mx-auto mb-9">
            Join growth teams who&apos;ve switched from LinkedIn Ads to real human outreach at scale. Setup in 48 hours.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/contact"
              className="px-8 py-3.5 rounded-xl text-[0.92rem] font-bold bg-white text-ind shadow-[0_4px_16px_rgba(0,0,0,.15)] hover:-translate-y-0.5 transition-all"
            >
              Contact us →
            </Link>
            <Link
              href="/contact"
              className="px-7 py-3.5 rounded-xl text-[0.92rem] font-semibold text-white/90 bg-white/10 border-[1.5px] border-white/25 hover:bg-white/18 transition-all"
            >
              Talk to us first
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
