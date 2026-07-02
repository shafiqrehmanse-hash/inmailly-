"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ClientContractPage from "@/components/client/ClientContractPage";
import LuxBackground from "@/components/home/LuxBackground";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";
import { createClient } from "@/lib/supabase/client";

export default function ClientContractRoutePage() {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/contract")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/client/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.client?.name) setClientName(data.client.name);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/client/login");
  }

  if (loading) {
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
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 h-[64px] flex items-center justify-between">
          <Link href="/client/dashboard" className="flex items-center gap-3">
            <InMaillyBrand size="sm" />
            <span className="text-[0.6rem] uppercase tracking-wider text-lux-muted border border-white/[0.08] px-2 py-0.5">
              Client
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {clientName && <span className="text-sm text-lux-muted hidden sm:inline">{clientName}</span>}
            <button type="button" onClick={logout} className="text-sm text-lux-muted hover:text-lux-text">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
        <ClientContractPage />
      </main>
    </div>
  );
}
