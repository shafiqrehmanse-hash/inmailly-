"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import LuxSelect from "@/components/ui/LuxSelect";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import { InMaillyMark } from "@/components/brand/InMaillyLogo";
import { cn } from "@/lib/utils";

export type ManagedNavItem = {
  href: string;
  label: string;
  icon: string;
  match?: (pathname: string, search: string) => boolean;
  critical?: boolean;
};

export type ManagedNavGroup = {
  title: string;
  items: ManagedNavItem[];
};

export default function ManagedShell({
  areaTitle,
  areaBadge,
  groups,
  children,
  onLogout,
}: {
  areaTitle: string;
  areaBadge: string;
  groups: ManagedNavGroup[];
  children: React.ReactNode;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const flat = groups.flatMap((g) => g.items);

  function isActive(item: ManagedNavItem) {
    if (item.match) return item.match(pathname, query);
    const [path, qs] = item.href.split("?");
    if (qs) return pathname === path && query === qs;
    if (path === pathname) return true;
    return pathname.startsWith(`${path}/`);
  }

  return (
    <div className="min-h-screen h-screen bg-lux-bg flex overflow-hidden relative">
      <WorkspaceAmbient />
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-white/[0.06] bg-lux-bg2/80 shrink-0">
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <Link href="/admin" className="text-[0.65rem] text-lux-muted hover:text-lux-cyan uppercase tracking-widest">
            ← Admin home
          </Link>
          <div className="flex items-center gap-2.5 mt-3">
            <InMaillyMark size={32} />
            <div>
              <div className="font-bricolage font-extrabold text-lux-text text-sm">{areaTitle}</div>
              <div className="text-[0.58rem] text-lux-muted uppercase tracking-widest">{areaBadge}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto min-h-0 space-y-4">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[0.58rem] font-bold uppercase tracking-widest text-lux-muted/80">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors border-l-2",
                      isActive(item)
                        ? "border-lux-cyan bg-gradient-to-r from-lux-cyan/12 via-lux-blue/8 to-transparent text-lux-cyan shadow-[inset_0_1px_0_rgba(34,211,238,0.12)]"
                        : "border-transparent text-lux-muted hover:text-lux-text hover:bg-white/[0.03]"
                    )}
                  >
                    <span className="w-5 text-center">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {item.critical && (
                      <span
                        className="admin-alert-dot w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)] shrink-0"
                        aria-label="Critical"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <button type="button" onClick={onLogout} className="text-sm text-lux-muted hover:text-lux-cyan">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-lux-card/80 gap-3">
          <Link href="/admin" className="text-xs text-lux-muted shrink-0">
            ← Home
          </Link>
          <LuxSelect
            className="flex-1 min-w-0"
            size="sm"
            value={flat.find((i) => isActive(i))?.href || flat[0]?.href || ""}
            onChange={(v) => {
              window.location.href = v;
            }}
            options={flat.map((i) => ({ value: i.href, label: i.label }))}
          />
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 sm:p-8 pb-16">{children}</main>
      </div>
    </div>
  );
}
