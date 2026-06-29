"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { HiArrowTrendingUp, HiBolt, HiEnvelope, HiUser } from "react-icons/hi2";

const NOTIFICATIONS = [
  { name: "Sarah Chen", action: "replied to InMail", time: "2s ago", type: "reply" },
  { name: "James Morrison", action: "accepted connection", time: "14s ago", type: "accept" },
  { name: "VP Growth @ Acme", action: "marked interested", time: "31s ago", type: "hot" },
];

const PIPELINE = [
  { label: "Sent", value: 84, color: "bg-lux-blue" },
  { label: "Opened", value: 62, color: "bg-lux-cyan" },
  { label: "Replied", value: 28, color: "bg-lux-violet" },
  { label: "Meeting", value: 11, color: "bg-emerald-400" },
];

export default function HeroDashboard() {
  const [notifIdx, setNotifIdx] = useState(0);
  const [messages, setMessages] = useState(2847);

  useEffect(() => {
    const t1 = setInterval(() => setNotifIdx((i) => (i + 1) % NOTIFICATIONS.length), 3200);
    const t2 = setInterval(() => setMessages((m) => m + Math.floor(Math.random() * 3)), 2400);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const n = NOTIFICATIONS[notifIdx];

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, rotateY: -8 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full perspective-[1200px]"
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-lux-blue/20 via-transparent to-lux-cyan/10 blur-2xl rounded-sm" />
      <div className="relative border border-white/[0.08] bg-lux-card/90 backdrop-blur-xl overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.12)]">
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-lux-bg2/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400/80" />
            <div className="w-2 h-2 rounded-full bg-amber-400/80" />
            <div className="w-2 h-2 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[0.65rem] uppercase tracking-[0.2em] text-lux-muted font-medium">
            Campaign · Live
          </span>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[0.65rem] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Messages today", value: messages.toLocaleString(), icon: HiEnvelope },
              { label: "Reply rate", value: "11.4%", icon: HiArrowTrendingUp },
              { label: "Cost / msg", value: "$0.27", icon: HiBolt },
            ].map((m) => (
              <div key={m.label} className="border border-white/[0.06] bg-lux-bg2/60 p-3">
                <m.icon className="w-4 h-4 text-lux-cyan mb-2 opacity-70" />
                <div className="font-bricolage font-extrabold text-xl text-lux-text tabular-nums">{m.value}</div>
                <div className="text-[0.6rem] uppercase tracking-wider text-lux-muted mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="border border-white/[0.06] bg-lux-bg2/40 p-4 h-[140px] relative overflow-hidden">
            <div className="text-[0.6rem] uppercase tracking-wider text-lux-muted mb-3">Outreach velocity</div>
            <svg className="absolute bottom-4 left-4 right-4 h-[80px]" viewBox="0 0 300 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(37,99,235,0.4)" />
                  <stop offset="100%" stopColor="rgba(37,99,235,0)" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0,70 L30,55 L60,60 L90,35 L120,40 L150,20 L180,25 L210,15 L240,30 L270,10 L300,5 L300,80 L0,80 Z"
                fill="url(#chartGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
              <motion.polyline
                points="0,70 30,55 60,60 90,35 120,40 150,20 180,25 210,15 240,30 270,10 300,5"
                fill="none"
                stroke="rgba(34,211,238,0.8)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              />
            </svg>
          </div>

          {/* Pipeline + notification */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-white/[0.06] bg-lux-bg2/40 p-3 space-y-2">
              <div className="text-[0.6rem] uppercase tracking-wider text-lux-muted">Pipeline</div>
              {PIPELINE.map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <span className="text-[0.65rem] text-lux-muted w-12">{p.label}</span>
                  <div className="flex-1 h-1 bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className={`h-full ${p.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.value}%` }}
                      transition={{ duration: 1.2, delay: 0.6 }}
                    />
                  </div>
                  <span className="text-[0.65rem] text-lux-text tabular-nums w-6">{p.value}</span>
                </div>
              ))}
            </div>

            <div className="border border-white/[0.06] bg-lux-bg2/40 p-3 relative min-h-[120px]">
              <div className="text-[0.6rem] uppercase tracking-wider text-lux-muted mb-2">Live activity</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={notifIdx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-8 h-8 border border-lux-blue/30 bg-lux-blue/10 flex items-center justify-center shrink-0">
                    <HiUser className="w-4 h-4 text-lux-cyan" />
                  </div>
                  <div>
                    <div className="text-[0.75rem] font-semibold text-lux-text">{n.name}</div>
                    <div className="text-[0.65rem] text-lux-muted">{n.action}</div>
                    <div className="text-[0.6rem] text-lux-cyan mt-0.5">{n.time}</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
