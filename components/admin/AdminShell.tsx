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
    <div className="min-h-screen bg-off flex">
      <aside className="hidden lg:flex w-[230px] flex-col bg-white border-r border-line shrink-0">
        <div className="px-5 py-6 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ind to-ind2 flex items-center justify-center font-bricolage font-extrabold text-sm text-white">
              I
            </div>
            <div>
              <div className="font-bricolage font-extrabold text-ink text-sm">InMailly</div>
              <div className="text-[0.58rem] text-dim uppercase tracking-widest">Admin</div>
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
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                tab === item.id
                  ? "bg-ind-light text-ind font-semibold"
                  : "text-mid hover:text-ink hover:bg-off"
              )}
            >
              <span className="w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-line">
          <button type="button" onClick={onLogout} className="text-sm text-dim hover:text-ink">
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-line bg-white">
          <span className="font-bricolage font-bold text-ink">Admin</span>
          <select
            className="input-field w-auto text-sm py-2"
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
        <main className="flex-1 p-5 sm:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
