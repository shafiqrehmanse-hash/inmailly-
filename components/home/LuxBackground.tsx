"use client";

import { motion } from "framer-motion";

export default function LuxBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-lux-bg">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(37,99,235,0.18), transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 10%, rgba(34,211,238,0.12), transparent 45%),
            radial-gradient(ellipse 50% 60% at 70% 80%, rgba(139,92,246,0.08), transparent 50%)
          `,
        }}
      />
      <motion.div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[120px] bg-lux-blue/20"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] bg-lux-cyan/15"
        animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[90px] bg-lux-violet/10"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />
      <div className="lux-noise absolute inset-0 opacity-[0.04] pointer-events-none" />
    </div>
  );
}
