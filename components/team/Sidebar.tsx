"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  id: string;
  label: string;
  icon: string;
  badge?: boolean;
  accent?: "cyan" | "violet" | "amber";
};

const sections: { label: string; tone: string; items: NavItem[] }[] = [
  {
    label: "Main",
    tone: "text-lux-cyan/70",
    items: [
      { id: "hub", href: "/team/hub", label: "Home", icon: "⌂", accent: "cyan" },
      { id: "links", href: "/team/links", label: "Work Links", icon: "⛓", badge: true, accent: "cyan" },
      { id: "leads", href: "/team/leads", label: "My Leads", icon: "◫", accent: "violet" },
    ],
  },
  {
    label: "Outreach",
    tone: "text-lux-violet/70",
    items: [
      { id: "responses", href: "/team/responses", label: "Responses", icon: "💬", accent: "violet" },
      { id: "referrals", href: "/team/referrals", label: "Earn & Refer", icon: "✦", accent: "amber" },
    ],
  },
  {
    label: "Account",
    tone: "text-slate-400/70",
    items: [{ id: "settings", href: "/team/settings", label: "Settings", icon: "⚙", accent: "cyan" }],
  },
];

const activeStyles: Record<NonNullable<NavItem["accent"]>, string> = {
  cyan: "border-lux-cyan bg-gradient-to-r from-lux-cyan/18 via-lux-cyan/6 to-transparent text-white shadow-[inset_0_1px_0_rgba(34,211,238,0.18),0_0_20px_rgba(34,211,238,0.08)]",
  violet:
    "border-lux-violet bg-gradient-to-r from-lux-violet/18 via-lux-violet/6 to-transparent text-white shadow-[inset_0_1px_0_rgba(167,139,250,0.15),0_0_20px_rgba(139,92,246,0.08)]",
  amber:
    "border-amber-400 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent text-white shadow-[inset_0_1px_0_rgba(251,191,36,0.12)]",
};

export default function Sidebar({
  member,
  poolCount,
}: {
  member: TeamMember;
  poolCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/team/login";
  }

  const NavContent = () => (
    <>
      <div className="px-5 pt-5 pb-5 border-b border-white/[0.06] bg-gradient-to-br from-cyan-500/[0.06] to-violet-600/[0.04]">
        <Link href="/team/hub" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center font-bricolage font-extrabold text-sm text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-[0.95rem] text-white tracking-tight">
              InMailly
            </div>
            <div className="text-[0.58rem] text-cyan-300/60 uppercase tracking-[0.2em] font-semibold">
              Team workspace
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto px-2">
        {sections.map((section) => (
          <div key={section.label} className="mb-3">
            <div
              className={cn(
                "text-[0.55rem] font-bold uppercase tracking-[0.18em] px-3 py-2",
                section.tone
              )}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const accent = item.accent || "cyan";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 border-l-[3px]",
                    active
                      ? activeStyles[accent]
                      : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <span className="w-[18px] text-center shrink-0 text-base">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && poolCount > 0 && (
                    <span className="bg-gradient-to-r from-cyan-500/25 to-blue-500/20 text-cyan-300 text-[0.58rem] font-bold px-2 py-0.5 rounded-full border border-cyan-400/25">
                      {poolCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mx-3 mb-4 p-3 rounded-xl border border-white/[0.08] bg-gradient-to-br from-slate-800/50 to-violet-950/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white font-medium truncate">{member.name}</div>
            <div className="text-[0.65rem] text-cyan-300/50">Outreach member</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full text-left text-xs text-slate-400 hover:text-rose-300 py-1.5 px-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex items-center justify-center text-lg text-white shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[240px] flex flex-col z-50 transition-transform duration-300",
          "bg-gradient-to-b from-[#080d18] via-[#0c1222] to-[#0f0a1a]",
          "border-r border-cyan-500/10 shadow-[4px_0_32px_rgba(0,0,0,0.45)]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
