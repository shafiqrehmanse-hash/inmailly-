"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LinkCard from "@/components/team/LinkCard";
import StatCard from "@/components/team/StatCard";
import Toast, { ToastType } from "@/components/team/Toast";
import { createClient } from "@/lib/supabase/client";
import type { OutreachLink, TeamMember } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "pool" | "mine" | "used";

export default function LinksPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("pool");
  const [member, setMember] = useState<TeamMember | null>(null);
  const [links, setLinks] = useState<OutreachLink[]>([]);
  const [stats, setStats] = useState({ pool: 0, claimed: 0, myActive: 0, iUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const memberRef = useRef<TeamMember | null>(null);

  const showToast = (message: string, type: ToastType = "success") =>
    setToast({ message, type });

  const ensureMember = useCallback(async () => {
    if (memberRef.current) return memberRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", user.id)
      .single();
    const m = data as TeamMember | null;
    if (m) {
      memberRef.current = m;
      setMember(m);
    }
    return m;
  }, [supabase]);

  const fetchStats = useCallback(
    async (memberId: string) => {
      const [pool, claimed, myActive, iUsed] = await Promise.all([
        supabase
          .from("outreach_links")
          .select("*", { count: "exact", head: true })
          .eq("status", "available")
          .is("member_id", null),
        supabase
          .from("outreach_links")
          .select("*", { count: "exact", head: true })
          .eq("status", "claimed"),
        supabase
          .from("outreach_links")
          .select("*", { count: "exact", head: true })
          .eq("member_id", memberId)
          .eq("status", "claimed"),
        supabase
          .from("outreach_links")
          .select("*", { count: "exact", head: true })
          .eq("used_by_member_id", memberId)
          .eq("status", "used"),
      ]);
      setStats({
        pool: pool.count || 0,
        claimed: claimed.count || 0,
        myActive: myActive.count || 0,
        iUsed: iUsed.count || 0,
      });
    },
    [supabase]
  );

  const fetchLinks = useCallback(
    async (activeTab: Tab, memberId: string) => {
      let query = supabase.from("outreach_links").select("*");

      if (activeTab === "pool") {
        query = query
          .eq("status", "available")
          .is("member_id", null)
          .order("created_at", { ascending: true })
          .limit(200);
      } else if (activeTab === "mine") {
        query = query
          .eq("member_id", memberId)
          .eq("status", "claimed")
          .order("claimed_at", { ascending: false });
      } else {
        query = query
          .eq("used_by_member_id", memberId)
          .eq("status", "used")
          .order("used_at", { ascending: false })
          .limit(80);
      }

      const { data } = await query;
      setLinks((data as OutreachLink[]) || []);
    },
    [supabase]
  );

  const refresh = useCallback(
    async (activeTab = tab) => {
      const m = await ensureMember();
      if (!m) return;
      await Promise.all([fetchLinks(activeTab, m.id), fetchStats(m.id)]);
      setLoading(false);
    },
    [ensureMember, fetchLinks, fetchStats, tab]
  );

  useEffect(() => {
    setLoading(true);
    refresh(tab);
  }, [tab, refresh]);

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel("links-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "outreach_links" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => refresh(tab), 400);
      })
      .subscribe();
    return () => {
      clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [supabase, refresh, tab]);

  async function handleClaim(link: OutreachLink) {
    if (!member) return;
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    const { data } = await supabase
      .from("outreach_links")
      .update({
        status: "claimed",
        member_id: member.id,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", link.id)
      .eq("status", "available")
      .is("member_id", null)
      .select()
      .single();
    if (data) {
      showToast("Link claimed!");
    } else {
      showToast("Link already claimed by someone else", "error");
    }
    refresh(tab);
  }

  async function handleMarkUsed(link: OutreachLink) {
    if (!member) return;
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    await supabase
      .from("outreach_links")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
        used_by_member_id: member.id,
      })
      .eq("id", link.id)
      .eq("member_id", member.id);
    showToast("Marked as used");
    refresh(tab);
  }

  async function handleRelease(link: OutreachLink) {
    if (!member) return;
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    await supabase
      .from("outreach_links")
      .update({ status: "available", member_id: null, claimed_at: null })
      .eq("id", link.id)
      .eq("member_id", member.id);
    showToast("Link released to pool");
    refresh(tab);
  }

  function handleAddLead(link: OutreachLink) {
    const params = new URLSearchParams({
      prefill_url: link.url,
      prefill_name: link.smart_label || "",
      source_link_id: link.id,
    });
    router.push(`/team/leads?${params.toString()}`);
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "pool", label: "Available", count: stats.pool },
    { id: "mine", label: "My active", count: stats.myActive },
    { id: "used", label: "Used", count: stats.iUsed },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">🔗 Outreach Links</h1>
        <p className="text-lux-muted text-[0.88rem] mt-2 leading-relaxed max-w-2xl">
          Pick a profile link from the pool admin shared — claim it, run outreach on LinkedIn,
          mark <strong className="text-lux-text">Used</strong>, then add as a Lead when they reply.
        </p>
      </div>

      <div className="lux-card p-4 text-lux-muted text-[0.84rem] leading-relaxed">
        <strong className="text-lux-cyan text-[0.7rem] uppercase tracking-wide block mb-1.5">
          ✨ Smart workflow tips
        </strong>
        LinkedIn profiles are auto-labeled from the URL. Sales Nav links get a different playbook.
        Always mark <strong className="text-lux-text">Used</strong> after outreach so admin can track
        progress.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={stats.pool} label="Available" />
        <StatCard value={stats.claimed} label="Claimed (team)" />
        <StatCard value={stats.myActive} label="Your active" />
        <StatCard value={stats.iUsed} label="You used" />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-full border text-[0.8rem] font-bold transition-colors",
              tab === t.id
                ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
                : "bg-white/[0.03] text-lux-muted border-white/[0.08] hover:border-lux-cyan/25"
            )}
          >
            {t.id === "pool" && "📥 "}
            {t.id === "mine" && "🎯 "}
            {t.id === "used" && "✅ "}
            {t.label} ({t.count})
          </button>
        ))}
        <a
          href="/team/leads"
          className="ml-auto text-sm font-bold text-lux-muted border border-dashed border-white/[0.12] rounded-full px-4 py-2 hover:border-lux-cyan/30 hover:text-lux-cyan"
        >
          ← Back to leads
        </a>
      </div>

      {loading ? (
        <p className="text-lux-muted text-center py-12">Loading links…</p>
      ) : links.length === 0 ? (
        <div className="lux-card text-center py-12 px-6 border-dashed border-white/[0.12]">
          <div className="text-4xl mb-3">{tab === "pool" ? "📭" : "✨"}</div>
          <p className="text-lux-muted text-sm">
            {tab === "pool"
              ? "No links in the pool right now — ask admin to import more in Team Admin."
              : tab === "mine"
                ? "You have no active links. Claim one from Available."
                : "You have not marked any links used yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              mode={tab}
              onClaim={() => handleClaim(link)}
              onMarkUsed={() => handleMarkUsed(link)}
              onRelease={() => handleRelease(link)}
              onAddLead={() => handleAddLead(link)}
            />
          ))}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
