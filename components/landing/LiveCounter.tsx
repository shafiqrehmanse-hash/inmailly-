"use client";

import { useEffect, useRef, useState } from "react";

function animCount(
  el: HTMLElement,
  end: number,
  duration: number,
  prefix: string,
  suffix: string,
  decimals: number
) {
  const start = 0;
  let startTime: number | null = null;
  function step(ts: number) {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const val = start + (end - start) * ease;
    const disp = decimals
      ? val.toFixed(decimals)
      : Math.round(val).toLocaleString();
    el.textContent = prefix + disp + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export default function LiveCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const cnt1 = useRef<HTMLDivElement>(null);
  const cnt2 = useRef<HTMLDivElement>(null);
  const cnt3 = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !animated) {
            setAnimated(true);
            if (cnt1.current)
              animCount(cnt1.current, 2847, 2000, "", "", 0);
            if (cnt2.current)
              animCount(cnt2.current, 11.4, 1800, "", "%", 1);
            if (cnt3.current)
              animCount(cnt3.current, 0.275, 1600, "$", "", 3);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animated]);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      if (!cnt1.current) return;
      const cur = parseInt(cnt1.current.textContent?.replace(/,/g, "") || "2847");
      const bump = Math.floor(Math.random() * 3) + 1;
      cnt1.current.textContent = (cur + bump).toLocaleString();
    }, 4000);
    return () => clearInterval(interval);
  }, [animated]);

  return (
    <div
      ref={ref}
      className="relative w-full max-w-[760px] bg-card border border-border rounded-3xl px-6 lg:px-10 py-8 grid grid-cols-1 md:grid-cols-3 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo/[0.06] to-cyan/[0.04] pointer-events-none" />
      <div className="absolute top-3 right-4 flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-green-400">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-breathe" />
        Live
      </div>
      {[
        { ref: cnt1, label: "Messages sent today", sub: "across all campaigns" },
        { ref: cnt2, label: "Average reply rate", sub: "vs 2% LinkedIn ads avg" },
        { ref: cnt3, label: "Cost per message", sub: "vs $6.67 LinkedIn InMail" },
      ].map((item, i) => (
        <div
          key={item.label}
          className={`relative text-center py-3 md:py-0 px-6 ${
            i > 0 ? "md:border-l border-white/[0.06] border-t md:border-t-0" : ""
          }`}
        >
          <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-dimmer mb-2.5">
            {item.label}
          </div>
          <div
            ref={item.ref}
            className="font-bricolage font-extrabold text-[2.4rem] leading-none bg-gradient-to-br from-white to-cyan2 bg-clip-text text-transparent tracking-tight"
          >
            0
          </div>
          <div className="text-[0.72rem] text-dimmer mt-2">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
