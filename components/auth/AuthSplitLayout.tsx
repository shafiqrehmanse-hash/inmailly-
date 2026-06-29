"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AuthSplitLayout({
  tab,
  onTabChange,
  children,
}: {
  tab: "login" | "register";
  onTabChange: (t: "login" | "register") => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center p-14 bg-[#0a150d] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,transparent,transparent 65px,#e4e1d8 65px,#e4e1d8 66px),repeating-linear-gradient(90deg,transparent,transparent 65px,#e4e1d8 65px,#e4e1d8 66px)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-[10px] bg-green-600 flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <span className="font-bricolage font-extrabold text-xl">
              In<span className="text-green-400">Mailly</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-green-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Team Portal
          </div>
          <h1 className="font-bricolage font-extrabold text-[2.4rem] leading-tight tracking-tight mb-4">
            Log your leads.
            <br />
            <span className="text-green-400">Track everything.</span>
          </h1>
          <p className="text-white/45 text-[0.95rem] leading-relaxed max-w-sm">
            Add leads directly from your Sales Nav outreach — name, profile, response status and
            notes — all in one place.
          </p>
          <ul className="mt-9 space-y-3">
            {[
              "Add leads in seconds",
              "Track response status instantly",
              "Your leads stay private to you",
              "Admin gets notified on signup & new leads",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 bg-off">
        <div className="w-full max-w-md">
          <div className="flex bg-white rounded-full p-1 border-[1.5px] border-line mb-8">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTabChange(t)}
                className={cn(
                  "flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors",
                  tab === t ? "bg-ink text-white" : "text-mid hover:text-ink"
                )}
              >
                {t === "login" ? "Log In" : "Join Team"}
              </button>
            ))}
          </div>
          {children}
          <p className="text-center text-[0.72rem] text-dimmer mt-8">
            Team portal:{" "}
            <Link href="/login" className="text-ind hover:underline">
              inmailly.vercel.app/login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function AuthFormHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <h2 className="font-bricolage font-extrabold text-2xl tracking-tight text-ink">{title}</h2>
      <p className="text-sm text-mid mt-1">{subtitle}</p>
    </div>
  );
}
