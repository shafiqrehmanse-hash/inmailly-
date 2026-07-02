"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import { cn } from "@/lib/utils";
import { useAdminKey } from "@/lib/admin-context";

const HUB_NAV = [
  { href: "/admin", label: "Overview", icon: "◫", exact: true },
  { href: "/admin/team", label: "Team", icon: "👥" },
  { href: "/admin/clients", label: "Clients", icon: "◇", criticalKey: "clients" as const },
  { href: "/admin/projects", label: "Projects", icon: "◎" },
  { href: "/admin/website", label: "Website", icon: "🌐" },
] as const;

export default function AdminHubShell({
  children,
  onLogout,
}: {
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const adminKey = useAdminKey();
  const [needsSetup, setNeedsSetup] = useState(0);

  const loadAlerts = useCallback(async () => {
    const res = await fetch(`/api/admin/overview?key=${adminKey}`);
    const data = await res.json();
    if (res.ok) {
      setNeedsSetup(data.projects?.needs_setup || 0);
    }
  }, [adminKey]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen h-screen bg-lux-bg flex overflow-hidden relative">
      <WorkspaceAmbient />
      <aside className="hidden lg:flex w-[220px] flex-col border-r border-white/[0.06] bg-lux-bg2/80 shrink-0">
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <InMaillyBrand size="sm" textClassName="text-sm" />
          <div className="text-[0.58rem] text-lux-muted uppercase tracking-widest mt-1 pl-0.5">Admin</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {HUB_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-l-2",
                isActive(item.href, "exact" in item ? item.exact : false)
                  ? "border-lux-cyan bg-lux-blue/15 text-lux-cyan"
                  : "border-transparent text-lux-muted hover:text-lux-text hover:bg-white/[0.03]"
              )}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {"criticalKey" in item && item.criticalKey === "clients" && needsSetup > 0 && (
                <span
                  className="admin-alert-dot w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] shrink-0"
                  title={`${needsSetup} client(s) need setup`}
                  aria-label={`${needsSetup} clients need setup`}
                />
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <button type="button" onClick={onLogout} className="text-sm text-lux-muted hover:text-lux-cyan">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 sm:p-8 pb-16">{children}</main>
      </div>
    </div>
  );
}
