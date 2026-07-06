"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";
import TeamAvatar from "@/components/team/TeamAvatar";

const NAV = [
  { id: "hub", href: "/content/hub", label: "My articles", icon: "✦" },
  { id: "write", href: "/content/write", label: "Write article", icon: "✎" },
  { id: "profile", href: "/content/profile", label: "Author profile", icon: "◎" },
];

export default function ContentSidebar({ member }: { member: TeamMember }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/content/login";
  }

  const NavContent = () => (
    <>
      <div className="px-5 pb-5 border-b border-white/[0.08]">
        <Link href="/content/hub" className="block" onClick={() => setOpen(false)}>
          <InMaillyBrand size="sm" />
          <div className="text-[0.58rem] text-lux-muted uppercase tracking-widest mt-1.5 pl-0.5">
            Content department
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto px-2 lux-scrollbar-hide">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
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
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/[0.08]">
        <div className="flex items-center gap-3 mb-3">
          <TeamAvatar name={member.name} photoUrl={member.photo_url} size="md" />
          <div className="min-w-0">
            <div className="text-sm text-lux-text truncate">{member.name}</div>
            <div className="text-[0.65rem] text-lux-cyan/80">Content manager</div>
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
