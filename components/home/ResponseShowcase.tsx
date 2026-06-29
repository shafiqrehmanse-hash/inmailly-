"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { MockLinkedInThread, ScreenshotFrame } from "@/components/client/ClientDashboard";
import { RESPONSE_SCREENSHOTS } from "@/lib/response-screenshots";
import MagneticButton from "./MagneticButton";

const ClientDashboard = dynamic(() => import("@/components/client/ClientDashboard"), {
  ssr: false,
  loading: () => (
    <div className="w-full min-h-[320px] lux-card animate-pulse flex items-center justify-center text-lux-muted text-sm">
      Loading dashboard…
    </div>
  ),
});

const MOCK_MESSAGES = [
  {
    name: "Sarah Chen",
    title: "VP Growth · Acme SaaS",
    message:
      "This is exactly what we've been looking for. Can we jump on a call this week? Your approach with verified profiles makes a lot of sense.",
    time: "Today, 9:14 AM",
    tag: "Interested",
  },
  {
    name: "James Morrison",
    title: "Head of Sales · NovaTech",
    message: "Send me pricing for 5k sends. We're comparing a few vendors but your dashboard sold me.",
    time: "Today, 8:42 AM",
    tag: "Hot lead",
  },
  {
    name: "Priya Nair",
    title: "Founder · Launchpad",
    message: "Love that it's human-operated on established Sales Nav accounts. Let's talk.",
    time: "Yesterday, 4:20 PM",
    tag: "Meeting set",
  },
];

export default function ResponseShowcase() {
  const [active, setActive] = useState(0);
  const shots = RESPONSE_SCREENSHOTS;
  const mock = MOCK_MESSAGES[active];

  return (
    <section id="responses" className="relative py-32 lg:py-40 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
          >
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-cyan font-semibold mb-6">
              Real responses
            </p>
            <h2 className="font-bricolage font-extrabold text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] text-lux-text">
              See exactly what your inbox looks like.
            </h2>
            <p className="mt-6 text-lux-muted leading-relaxed max-w-md">
              Every reply lands in your client dashboard — the same view you saw on our homepage.
              Verified Sales Nav profiles. Real conversations. Full transparency.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {shots.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wider transition-all ${
                    active === i
                      ? "bg-lux-blue text-white"
                      : "border border-white/[0.08] text-lux-muted hover:text-lux-text"
                  }`}
                >
                  {s.tag}
                </button>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <MagneticButton href="/client/demo">See sample dashboard</MagneticButton>
              <MagneticButton href="/client/register" variant="ghost">
                Create account
              </MagneticButton>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-lux-cyan/10 blur-3xl" />
            <ScreenshotFrame
              src={shots[active]?.src}
              imageBase64={shots[active]?.imageBase64}
              alt={shots[active]?.title || "Response screenshot"}
            >
              <MockLinkedInThread {...mock} />
            </ScreenshotFrame>
            <p className="text-[0.65rem] text-lux-muted mt-4 text-center">
              {shots[active]?.subtitle} —{" "}
              <Link href="/contact" className="text-lux-cyan hover:underline">
                Replace with your screenshots anytime
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Full dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-24"
        >
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-lux-muted font-semibold mb-6 text-center">
            Your client command center
          </p>
          <ClientDashboard mode="full" />
        </motion.div>
      </div>
    </section>
  );
}
