"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/lib/types";

const mainNav = [
  { href: "/team/hub", label: "Home", icon: "⌂" },
  { href: "/team/links", label: "Work Links", icon: "⛓", badge: true },
  { href: "/team/leads", label: "My Leads", icon: "◫" },
];

const outreachNav = [
  { href: "/team/responses", label: "Responses", icon: "💬" },
  { href: "/team/referrals", label: "Earn & Refer", icon: "✦" },
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

  const NavContent = () => (
    <>
      <div className="px-5 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center font-bricolage font-extrabold text-sm">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-sm">InMailly</div>
            <div className="text-[0.58rem] text-dimmer uppercase tracking-widest">
              Team workspace
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        <NavGroup label="Main">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname === item.href}
              badgeCount={item.badge ? poolCount : undefined}
              onClick={() => setOpen(false)}
            />
          ))}
        </NavGroup>
        <NavGroup label="Outreach">
          {outreachNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={pathname === item.href}
              onClick={() => setOpen(false)}
            />
          ))}
        </NavGroup>
        <NavGroup label="Account">
          <NavLink
            href="/team/hub"
            label="Settings"
            icon="⚙"
            active={false}
            onClick={() => setOpen(false)}
          />
        </NavGroup>
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.06] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo to-cyan flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <div>
          <div className="text-sm text-white/80">{member.name}</div>
          <div className="text-[0.65rem] text-dimmer capitalize">{member.role}</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-lg"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        ☰
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-[230px] bg-[#060818] border-r border-white/[0.05] flex flex-col z-50 transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 mb-1">
      <div className="text-[0.55rem] font-bold uppercase tracking-widest text-white/20 px-2 py-2">
        {label}
      </div>
      {children}
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
  badgeCount,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  badgeCount?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5",
        active
          ? "border-l-2 border-indigo2 bg-indigo/14 text-white pl-[10px]"
          : "text-white/45 hover:text-white/70 hover:bg-white/[0.03]"
      )}
    >
      <span className="w-[18px] text-center">{icon}</span>
      <span>{label}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="ml-auto bg-indigo/25 text-indigo2 text-[0.58rem] font-bold px-2 py-0.5 rounded-full">
          {badgeCount}
        </span>
      )}
    </Link>
  );
}
