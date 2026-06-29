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
  desc?: string;
  icon: string;
  badge?: boolean;
  external?: boolean;
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { id: "hub", href: "/team/hub", label: "Home", desc: "Overview", icon: "⌂" },
      { id: "leads", href: "/team/leads", label: "My Leads", desc: "Pipeline", icon: "◫" },
      { id: "links", href: "/team/links", label: "Work Links", desc: "Outreach pool", icon: "⛓", badge: true },
    ],
  },
  {
    label: "Growth",
    items: [
      { id: "branding", href: "/team/branding", label: "Branding", desc: "LinkedIn kit", icon: "◈" },
      { id: "referrals", href: "/team/referrals", label: "Refer & earn", desc: "Commissions", icon: "✦" },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "settings", href: "/team/settings", label: "Settings", desc: "Profile & phone", icon: "⚙" },
    ],
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
    window.location.href = "/login";
  }

  const NavContent = () => (
    <>
      <div className="px-5 pb-5 border-b border-white/[0.07]">
        <Link href="/team/hub" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center font-bricolage font-extrabold text-sm text-white">
            ✓
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-sm text-white">
              In<span className="text-green-400">Mailly</span>
            </div>
            <div className="text-[0.58rem] text-white/35 uppercase tracking-widest">Team workspace</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="px-3 mb-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-widest text-white/20 px-2 py-2">
              {section.label}
            </div>
            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.id === "leads" && pathname === "/team/responses");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5",
                    active
                      ? "bg-ind2/20 text-white border border-ind2/30"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  )}
                >
                  <span className="w-[18px] text-center shrink-0">{item.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-tight">{item.label}</span>
                    {item.desc && (
                      <span className="block text-[0.62rem] text-white/25 mt-0.5">{item.desc}</span>
                    )}
                  </span>
                  {item.badge && poolCount > 0 && (
                    <span className="bg-green-500/20 text-green-300 text-[0.58rem] font-bold px-2 py-0.5 rounded-full">
                      {poolCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ind to-sky flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white/80 truncate">{member.name}</div>
            <div className="text-[0.65rem] text-white/35 capitalize">Team member</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full text-left text-sm text-white/40 hover:text-white/70 py-1.5"
        >
          Log out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-lg shadow-sm"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[240px] bg-ink2 flex flex-col z-50 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
