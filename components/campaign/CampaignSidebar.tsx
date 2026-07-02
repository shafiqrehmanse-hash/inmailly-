"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";

type NavItem = { id: string; href: string; label: string; icon: string };

const CLIENT_NAV: NavItem[] = [
  { id: "campaigns", href: "/campaign/hub", label: "My campaigns", icon: "◎" },
];

const OUTREACH_NAV: NavItem[] = [
  { id: "outreach-hub", href: "/campaign/outreach", label: "Outreach home", icon: "⌂" },
  { id: "links", href: "/campaign/outreach/links", label: "Work links", icon: "⛓" },
  { id: "scripts", href: "/campaign/outreach/scripts", label: "Scripts", icon: "📋" },
  { id: "leads", href: "/campaign/outreach/leads", label: "My leads", icon: "◫" },
  { id: "responses", href: "/campaign/outreach/responses", label: "Responses", icon: "💬" },
];

export default function CampaignSidebar({ member }: { member: TeamMember }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const inOutreach = pathname.startsWith("/campaign/outreach");
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/campaign/login";
  }

  function renderSection(title: string, tone: string, items: NavItem[]) {
    return (
      <div className="mb-3">
        <div className={cn("text-[0.55rem] font-bold uppercase tracking-widest px-2 py-2", tone)}>
          {title}
        </div>
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/campaign/hub" && item.href !== "/campaign/outreach" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 border-l-2",
                active
                  ? "border-lux-violet bg-lux-violet/10 text-lux-text"
                  : "border-transparent text-lux-muted hover:text-lux-text hover:bg-white/[0.04]"
              )}
            >
              <span className="w-[18px] text-center shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  const NavContent = () => (
    <>
      <div className="px-5 pb-5 border-b border-white/[0.08]">
        <Link href="/campaign/hub" className="block" onClick={() => setOpen(false)}>
          <InMaillyBrand size="sm" />
          <div className="text-[0.58rem] text-lux-muted uppercase tracking-widest mt-1.5 pl-0.5">
            Campaign department
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto px-2 lux-scrollbar-hide">
        {renderSection("Client management", "text-lux-cyan/70", CLIENT_NAV)}
        {renderSection("InMailly outreach", "text-lux-violet/70", OUTREACH_NAV)}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lux-violet to-lux-cyan flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-lux-text truncate">{member.name}</div>
            <div className="text-[0.65rem] text-lux-violet/80">
              {inOutreach ? "Outreach mode" : "Campaign manager"}
            </div>
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
          "fixed top-0 left-0 h-full w-[240px] bg-lux-bg2 border-r border-white/[0.08] flex flex-col z-50 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
