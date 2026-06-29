import Link from "next/link";
import LiveCounter from "./LiveCounter";

export default function Hero() {
  return (
    <section className="relative z-[1] min-h-screen flex flex-col items-center justify-center px-5 lg:px-10 pt-[120px] pb-20 text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan/30 bg-cyan/[0.06] text-[0.72rem] font-semibold tracking-widest uppercase text-cyan2 mb-8">
        <div className="w-5 h-5 rounded-full bg-cyan/15 border border-cyan/40 flex items-center justify-center">
          <div className="w-[7px] h-[7px] rounded-full bg-cyan animate-breathe" />
        </div>
        LinkedIn outreach — without LinkedIn&apos;s price
      </div>

      <h1 className="font-bricolage font-extrabold text-[clamp(3rem,7.5vw,6rem)] leading-none tracking-tight max-w-[920px] mb-1.5">
        Reach 50,000 buyers
        <span className="block bg-gradient-to-r from-indigo2 via-cyan to-cyan2 bg-clip-text text-transparent pb-1">
          for less than one ad spend.
        </span>
      </h1>

      <p className="text-[1.05rem] leading-relaxed text-dim max-w-[520px] mt-6 mb-10">
        LinkedIn charges $6.67 per InMail. We deliver 1,000 personalized messages for $275 — with real human operators, full reply tracking, and zero ad platform complexity.
      </p>

      <div className="flex gap-3.5 flex-wrap justify-center mb-16">
        <Link
          href="/register"
          className="px-8 py-4 rounded-xl text-[0.95rem] font-bold text-white bg-gradient-to-br from-indigo to-indigo2 shadow-[0_8px_32px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          Start your campaign <span>→</span>
        </Link>
        <a
          href="#pricing"
          className="px-7 py-4 rounded-xl text-[0.95rem] font-semibold text-dim bg-white/[0.04] border border-white/10 hover:text-white hover:border-white/[0.22] hover:bg-white/[0.07] transition-all"
        >
          See pricing
        </a>
      </div>

      <LiveCounter />
    </section>
  );
}
