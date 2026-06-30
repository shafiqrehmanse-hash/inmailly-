"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import { cn } from "@/lib/utils";

const HUB_NAV = [
  { href: "/admin", label: "Overview", icon: "◫", exact: true },
  { href: "/admin/team", label: "Team", icon: "👥" },
  { href: "/admin/clients", label: "Clients", icon: "◇" },
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

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen h-screen bg-lux-bg flex overflow-hidden relative">
      <WorkspaceAmbient />
      <aside className="hidden lg:flex w-[220px] flex-col border-r border-white/[0.06] bg-lux-bg2/80 shrink-0">
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 border border-lux-blue/40 bg-lux-blue/10 flex items-center justify-center font-bricolage font-extrabold text-sm text-lux-blue">
              I
            </div>
            <div>
              <div className="font-bricolage font-extrabold text-lux-text text-sm">InMailly</div>
              <div className="text-[0.58rem] text-lux-muted uppercase tracking-widest">Admin</div>
            </div>
          </div>
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
              <span>{item.label}</span>
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
