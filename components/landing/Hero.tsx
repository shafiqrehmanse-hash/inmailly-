import Link from "next/link";
import LiveCounter from "./LiveCounter";

export default function Hero() {
  return (
    <section className="relative pt-[140px] pb-20 px-5 lg:px-12 text-center bg-gradient-to-b from-off to-white overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-55"
        style={{
          backgroundImage:
            "linear-gradient(#e4e7ef 1px, transparent 1px), linear-gradient(90deg, #e4e7ef 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 100%)",
        }}
      />
      <div className="relative z-[1]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ind-light border-[1.5px] border-ind/20 text-[0.72rem] font-bold tracking-widest uppercase text-ind mb-7">
          <div className="w-[18px] h-[18px] rounded-full bg-ind/15 flex items-center justify-center">
            <div className="w-[7px] h-[7px] rounded-full bg-ind animate-pulse" />
          </div>
          LinkedIn outreach — without the LinkedIn price
        </div>

        <h1 className="font-bricolage font-extrabold text-[clamp(3rem,7vw,5.6rem)] leading-[1.04] tracking-tight text-ink max-w-[860px] mx-auto">
          Reach 50,000 buyers
          <br />
          for{" "}
          <em className="not-italic bg-gradient-to-r from-ind to-sky bg-clip-text text-transparent">
            less than one ad spend.
          </em>
        </h1>

        <p className="text-[1.05rem] text-mid leading-relaxed max-w-[520px] mx-auto mt-5 mb-9">
          LinkedIn charges $6.67 per InMail. We send 1,000 personalized messages for $275 — real human delivery, full reply tracking, zero ad platform complexity.
        </p>

        <div className="flex gap-3 justify-center flex-wrap mb-14">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[0.95rem] font-bold text-white bg-ind shadow-[0_4px_16px_rgba(67,56,202,.3)] hover:bg-ind2 hover:-translate-y-0.5 transition-all"
          >
            Get in touch →
          </Link>
          <a
            href="#pricing"
            className="inline-flex items-center px-7 py-3.5 rounded-xl text-[0.95rem] font-semibold text-mid bg-white border-[1.5px] border-line2 hover:border-ind hover:text-ind hover:bg-ind-light transition-all"
          >
            See pricing
          </a>
        </div>

        <LiveCounter />
      </div>
    </section>
  );
}
