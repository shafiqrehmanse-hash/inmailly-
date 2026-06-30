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
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { id: "hub", href: "/team/hub", label: "Home", icon: "⌂" },
      { id: "links", href: "/team/links", label: "Work Links", icon: "⛓", badge: true },
      { id: "leads", href: "/team/leads", label: "My Leads", icon: "◫" },
    ],
  },
  {
    label: "Outreach",
    items: [
      { id: "responses", href: "/team/responses", label: "Responses", icon: "💬" },
      { id: "referrals", href: "/team/referrals", label: "Earn & Refer", icon: "✦" },
    ],
  },
  {
    label: "Account",
    items: [{ id: "settings", href: "/team/settings", label: "Settings", icon: "⚙" }],
  },
];

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
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <Link href="/team/hub" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-10 h-10 rounded-lg bg-[#E51937] flex items-center justify-center font-bricolage font-extrabold text-base text-white shadow-[0_4px_20px_rgba(229,25,55,0.45)]">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-base text-white tracking-tight">
              InMailly
            </div>
            <div className="text-[0.58rem] text-[#a3a3a3] uppercase tracking-[0.18em] font-semibold">
              Team workspace
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto px-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <div className="text-[0.55rem] font-bold uppercase tracking-[0.2em] text-[#737373] px-3 py-2">
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 border-l-[3px]",
                    active
                      ? "border-[#E51937] bg-[rgba(229,25,55,0.12)] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "border-transparent text-[#a3a3a3] hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <span className="w-[18px] text-center shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && poolCount > 0 && (
                    <span className="bg-[#E51937] text-white text-[0.58rem] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {poolCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mx-3 mb-4 p-3.5 rounded-xl border border-white/[0.08] bg-[#141414]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[#E51937] flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white font-medium truncate">{member.name}</div>
            <div className="text-[0.65rem] text-[#737373]">Outreach member</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full text-left text-xs text-[#a3a3a3] hover:text-[#ff6b7a] py-1 transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-[#141414] border border-[rgba(229,25,55,0.3)] flex items-center justify-center text-lg text-white shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[248px] flex flex-col z-50 transition-transform duration-300",
          "bg-[#0f0f0f] border-r border-white/[0.06]",
          "shadow-[4px_0_40px_rgba(0,0,0,0.5)]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 40% at 0% 0%, rgba(229,25,55,0.15), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col h-full">{NavContent()}</div>
      </aside>
    </>
  );
}
