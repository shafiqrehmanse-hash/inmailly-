"use client";

import { cn } from "@/lib/utils";

const NAV = [
  { id: "overview", label: "Overview", icon: "◫" },
  { id: "links", label: "Links", icon: "⛓" },
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
    <div className="min-h-screen bg-ws-bg flex">
      <aside className="hidden lg:flex w-[220px] flex-col bg-[#060818] border-r border-ws-border shrink-0">
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <div className="font-bricolage font-extrabold text-white">InMailly</div>
          <div className="text-[0.58rem] text-white/35 uppercase tracking-widest mt-0.5">Admin panel</div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTab(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                tab === item.id
                  ? "bg-ws-ind/20 text-white border-l-2 border-ws-ind -ml-px pl-[11px]"
                  : "text-white/45 hover:text-white/75 hover:bg-white/[0.04]"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onLogout}
            className="text-sm text-white/40 hover:text-white/70"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-ws-border bg-ws-card">
          <span className="font-bricolage font-bold text-white">Admin</span>
          <select
            className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-2 py-1"
            value={tab}
            onChange={(e) => onTab(e.target.value as AdminTab)}
          >
            {NAV.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
        </header>
        <main className="flex-1 p-5 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
