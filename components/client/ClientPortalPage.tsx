"use client";

import Link from "next/link";
import ClientDashboard from "@/components/client/ClientDashboard";
import LuxBackground from "@/components/home/LuxBackground";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";

export default function ClientPortalPage() {
  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text">
      <LuxBackground />
      <header className="border-b border-white/[0.06] bg-lux-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-[64px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <InMaillyBrand size="sm" />
            <span className="text-[0.6rem] uppercase tracking-wider text-lux-muted border border-white/[0.08] px-2 py-0.5">
              Client
            </span>
          </Link>
          <Link href="/contact" className="lux-btn-primary text-[0.75rem] py-2.5 px-5">
            Upgrade campaign
          </Link>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        <div className="mb-8">
          <h1 className="font-bricolage font-extrabold text-3xl text-lux-text">Campaign dashboard</h1>
          <p className="text-lux-muted mt-2 text-sm">
            Sample data preview — create a free account at{" "}
            <a href="/client/register" className="text-lux-cyan hover:underline">
              /client/register
            </a>{" "}
            to see your own dashboard.
          </p>
        </div>
        <ClientDashboard mode="full" />
      </main>
    </div>
  );
}
