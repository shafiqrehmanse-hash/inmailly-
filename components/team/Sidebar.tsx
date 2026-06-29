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
      { id: "projects", href: "/team/hub", label: "My Projects", icon: "◎" },
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
      <div className="px-5 pb-5 border-b border-white/[0.08]">
        <Link href="/team/hub" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lux-blue to-lux-cyan flex items-center justify-center font-bricolage font-extrabold text-sm text-white">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-sm text-lux-text">InMailly</div>
            <div className="text-[0.58rem] text-lux-muted uppercase tracking-widest">Team workspace</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="px-3 mb-1">
            <div className="text-[0.55rem] font-bold uppercase tracking-widest text-lux-muted/60 px-2 py-2">
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
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 border-l-2",
                    active
                      ? "border-lux-cyan bg-lux-cyan/10 text-lux-text"
                      : "border-transparent text-lux-muted hover:text-lux-text hover:bg-white/[0.04]"
                  )}
                >
                  <span className="w-[18px] text-center shrink-0">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && poolCount > 0 && (
                    <span className="bg-lux-cyan/15 text-lux-cyan text-[0.58rem] font-bold px-2 py-0.5 rounded-full">
                      {poolCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lux-blue to-lux-cyan flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-lux-text truncate">{member.name}</div>
            <div className="text-[0.65rem] text-lux-muted">Outreach member</div>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full text-left text-sm text-lux-muted hover:text-lux-text py-1.5"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl lux-card flex items-center justify-center text-lg text-lux-text"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[220px] bg-lux-bg2 border-r border-white/[0.08] flex flex-col z-50 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
