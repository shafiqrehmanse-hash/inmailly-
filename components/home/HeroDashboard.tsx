"use client";

import { motion } from "framer-motion";
import ClientDashboard from "@/components/client/ClientDashboard";

export default function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
    >
      <div className="absolute -inset-4 bg-gradient-to-br from-lux-blue/20 via-transparent to-lux-cyan/10 blur-2xl" />
      <ClientDashboard mode="hero" />
    </motion.div>
  );
}
