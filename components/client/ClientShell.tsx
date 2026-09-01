"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LuxBackground from "@/components/home/LuxBackground";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import ClientLiveChatWidget from "@/components/client/ClientLiveChatWidget";
import {
  HiChartBarSquare,
  HiDocumentText,
  HiHome,
  HiPaintBrush,
  HiUserCircle,
} from "react-icons/hi2";

const NAV = [
  { href: "/client/dashboard", label: "Dashboard", icon: HiHome },
  { href: "/client/campaign", label: "Campaign", icon: HiChartBarSquare },
  { href: "/client/profiles", label: "Sender profiles", icon: HiUserCircle },
  { href: "/client/branding", label: "Branding", icon: HiPaintBrush },
  { href: "/client/contract", label: "Contract", icon: HiDocumentText },
];

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [pendingBranding, setPendingBranding] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/client/me"), fetch("/api/client/branding")])
      .then(async ([meRes, brandRes]) => {
        if (meRes.status === 401) {
          router.replace("/client/login");
          return;
        }
        const me = await meRes.json();
        if (me.client?.name) setClientName(me.client.name);
        if (brandRes.ok) {
          const brand = await brandRes.json();
          setPendingBranding(Boolean(brand.pendingRequest));
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, [router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/client/login");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-lux-bg flex items-center justify-center text-lux-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-text">
      <LuxBackground />
      <header className="border-b border-white/[0.06] bg-lux-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-[64px] flex items-center justify-between gap-4">
          <Link href="/client/dashboard" className="flex items-center gap-3 shrink-0">
            <InMaillyBrand size="sm" />
            <span className="text-[0.6rem] uppercase tracking-wider text-lux-muted border border-white/[0.08] px-2 py-0.5 hidden xs:inline">
              Client portal
            </span>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            {clientName && (
              <span className="text-sm text-lux-muted hidden md:inline truncate max-w-[160px]">
                {clientName}
              </span>
            )}
            <button type="button" onClick={logout} className="text-sm text-lux-muted hover:text-lux-text">
              Sign out
            </button>
          </div>
        </div>
        <nav className="border-t border-white/[0.04] bg-lux-bg/60">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex gap-1 overflow-x-auto scrollbar-none py-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              const alert = href === "/client/branding" && pendingBranding;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-[0.72rem] font-semibold uppercase tracking-wider whitespace-nowrap rounded-lg transition-colors relative",
                    active
                      ? "text-lux-cyan bg-lux-cyan/10"
                      : "text-lux-muted hover:text-lux-text hover:bg-white/[0.04]"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {alert && (
                    <span
                      className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                      aria-label="Action required"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">{children}</main>
      <ClientLiveChatWidget />
    </div>
  );
}
