"use client";

import LuxSelect from "@/components/ui/LuxSelect";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "links", label: "Links", icon: "⛓" },
  { id: "clients", label: "Clients", icon: "◇" },
  { id: "projects", label: "Projects", icon: "◎" },
  { id: "website", label: "Website", icon: "🌐" },
  { id: "team", label: "Team", icon: "👥" },
  { id: "leads", label: "Leads", icon: "📋" },
  { id: "scripts", label: "Scripts", icon: "📝" },
  { id: "referrals", label: "Referrals", icon: "✦" },
  { id: "funds", label: "Funds", icon: "💰" },
] as const;

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
          {NAV.map((item) => (
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
