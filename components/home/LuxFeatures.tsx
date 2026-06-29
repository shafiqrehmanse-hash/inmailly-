"use client";

import { motion } from "framer-motion";
import { HiChatBubbleLeftRight, HiLink, HiShieldCheck, HiUsers } from "react-icons/hi2";

const FEATURES = [
  {
    icon: HiShieldCheck,
    tag: "Accounts",
    title: "Verified Sales Nav profiles",
    desc: "Established LinkedIn accounts with Sales Navigator activated. Not your personal profile — our verified infrastructure.",
    align: "left" as const,
  },
  {
    icon: HiUsers,
    tag: "Delivery",
    title: "You send two things. We do the rest.",
    desc: "Target audience list + InMail script. Our operators and internal software handle every send, track, and reply.",
    align: "right" as const,
  },
  {
    icon: HiChatBubbleLeftRight,
    tag: "Dashboard",
    title: "Client command center",
    desc: "Same dashboard on the homepage and at /client. Live replies, pipeline, analytics — built for founders who demand clarity.",
    align: "left" as const,
  },
  {
    icon: HiLink,
    tag: "Trial",
    title: "200 InMails free",
    desc: "Full campaign with real results before you pay. Love the reply rate? Scale to thousands at $0.27 per message.",
    align: "right" as const,
  },
];

export default function LuxFeatures() {
  return (
    <section id="features" className="relative py-32 lg:py-40 border-t border-white/[0.04]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 space-y-32">
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9 }}
            className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
              f.align === "right" ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-lux-violet font-semibold">
                {f.tag}
              </span>
              <h3 className="font-bricolage font-extrabold text-[clamp(1.8rem,4vw,3rem)] text-lux-text mt-4 leading-tight">
                {f.title}
              </h3>
              <p className="text-lg text-lux-muted mt-5 leading-relaxed max-w-md">{f.desc}</p>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-lux-blue/10 to-transparent blur-2xl" />
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.4 }}
                className="relative border border-white/[0.08] bg-lux-card p-10 lg:p-14"
              >
                <f.icon className="w-12 h-12 text-lux-cyan mb-6 opacity-80" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-2 bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-lux-blue/60 to-lux-cyan/40"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${90 - j * 20}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + j * 0.15 }}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
