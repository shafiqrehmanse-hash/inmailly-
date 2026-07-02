"use client";

import LuxSelect from "@/components/ui/LuxSelect";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";
import { cn } from "@/lib/utils";

const MAIN_NAV = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "links", label: "Links", icon: "⛓" },
  { id: "clients", label: "Clients", icon: "◇" },
  { id: "projects", label: "Projects", icon: "◎" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "leads", label: "Leads", icon: "📋" },
  { id: "scripts", label: "Scripts", icon: "📝" },
  { id: "referrals", label: "Referrals", icon: "✦" },
  { id: "funds", label: "Funds", icon: "💰" },
] as const;

const BOTTOM_NAV = [{ id: "website", label: "Website", icon: "🌐" }] as const;

const NAV = [...MAIN_NAV, ...BOTTOM_NAV];

export type AdminTab = (typeof NAV)[number]["id"];

export default function AdminShell({
  tab,
  onTab,
  children,
  onLogout,
}: {
  tab: AdminTab;
  onTab: (t: AdminTab) => void;
  children: React.ReactNode;
  onLogout: () => void;
}) {
  return (
    <div className="min-h-screen h-screen bg-lux-bg flex overflow-hidden">
      <aside className="hidden lg:flex w-[220px] flex-col border-r border-white/[0.06] bg-lux-bg2/80 shrink-0">
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <InMaillyBrand size="sm" textClassName="text-sm" />
          <div className="text-[0.58rem] text-lux-muted uppercase tracking-widest mt-1 pl-0.5">Admin</div>
        </div>
        <nav className="flex-1 p-3 flex flex-col min-h-0">
          <div className="space-y-0.5 flex-1">
            {MAIN_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors border-l-2",
                  tab === item.id
                    ? "border-lux-cyan bg-lux-blue/15 text-lux-cyan"
                    : "border-transparent text-lux-muted hover:text-lux-text hover:bg-white/[0.03]"
                )}
              >
                <span className="w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="space-y-0.5 pt-3 mt-3 border-t border-white/[0.06]">
            {BOTTOM_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors border-l-2",
                  tab === item.id
                    ? "border-lux-cyan bg-lux-blue/15 text-lux-cyan"
                    : "border-transparent text-lux-muted hover:text-lux-text hover:bg-white/[0.03]"
                )}
              >
                <span className="w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <button type="button" onClick={onLogout} className="text-sm text-lux-muted hover:text-lux-cyan">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-lux-card/80">
          <span className="font-bricolage font-bold text-lux-text">Admin</span>
          <LuxSelect
            className="w-40"
            size="sm"
            value={tab}
            onChange={(v) => onTab(v as AdminTab)}
            options={NAV.map((n) => ({ value: n.id, label: n.label }))}
          />
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-5 sm:p-8 pb-16">{children}</main>
      </div>
    </div>
  );
}
