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
  const c1 = useRef<HTMLDivElement>(null);
  const c2 = useRef<HTMLDivElement>(null);
  const c3 = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          setAnimated(true);
          if (c1.current) animCount(c1.current, 2847, 2000, "", "", 0);
          if (c2.current) animCount(c2.current, 11.4, 1800, "", "%", 1);
          if (c3.current) animCount(c3.current, 0.275, 1600, "$", "", 3);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animated]);

  useEffect(() => {
    if (!animated) return;
    const interval = setInterval(() => {
      if (!c1.current) return;
      const cur = parseInt(c1.current.textContent?.replace(/,/g, "") || "2847");
      c1.current.textContent = (cur + Math.floor(Math.random() * 3) + 1).toLocaleString();
    }, 4000);
    return () => clearInterval(interval);
  }, [animated]);

  return (
    <div
      ref={ref}
      className="relative grid grid-cols-1 md:grid-cols-3 max-w-[760px] mx-auto bg-white border-[1.5px] border-line rounded-[20px] shadow-card overflow-hidden"
    >
      {[
        { ref: c1, label: "Messages sent today", sub: "across all active campaigns", live: true },
        { ref: c2, label: "Average reply rate", sub: "vs 2% LinkedIn ads average", live: false },
        { ref: c3, label: "Cost per message", sub: "vs $6.67 LinkedIn InMail credit", live: false },
      ].map((item, i) => (
        <div
          key={item.label}
          className={`relative py-7 px-6 text-center ${i > 0 ? "md:border-l border-line border-t md:border-t-0" : ""}`}
        >
          {item.live && (
            <div className="absolute top-2.5 right-3 flex items-center gap-1 text-[0.58rem] font-bold uppercase tracking-widest text-green">
              <div className="w-[5px] h-[5px] rounded-full bg-green animate-pulse" />
              Live
            </div>
          )}
          <div className="text-[0.65rem] font-bold uppercase tracking-widest text-dimmer mb-2.5">
            {item.label}
          </div>
          <div
            ref={item.ref}
            className="font-bricolage font-extrabold text-[2.2rem] tracking-tight text-ind leading-none"
          >
            0
          </div>
          <div className="text-[0.72rem] text-dimmer mt-2">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}
