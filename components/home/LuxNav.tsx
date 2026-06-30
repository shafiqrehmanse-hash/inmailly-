"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import MagneticButton from "./MagneticButton";

const LINKS = [
  { href: "#story", label: "Story" },
  { href: "#responses", label: "Responses" },
  { href: "/client/register", label: "Get started" },
  { href: "#pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function LuxNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-lux-bg/80 backdrop-blur-2xl border-b border-white/[0.06]" : ""
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 border border-lux-blue/40 bg-lux-blue/10 flex items-center justify-center font-bricolage font-extrabold text-sm text-lux-blue group-hover:border-lux-cyan/50 transition-colors">
            I
          </div>
          <span className="font-bricolage font-extrabold text-lg tracking-tight text-lux-text">InMailly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-[0.8rem] font-medium text-lux-muted hover:text-lux-text transition-colors tracking-wide"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <MagneticButton href="/client/register">Create account</MagneticButton>
      </div>
    </motion.header>
  );
}
