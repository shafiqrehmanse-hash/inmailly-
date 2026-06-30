"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LinkCard from "@/components/team/LinkCard";
import StatCard from "@/components/team/StatCard";
import Toast, { ToastType } from "@/components/team/Toast";
import Pagination from "@/components/ui/Pagination";
import PageSizeSelect from "@/components/ui/PageSizeSelect";
import { createClient } from "@/lib/supabase/client";
import type { OutreachLink, TeamMember } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, readStoredPageSize, storePageSize } from "@/lib/pagination";
import { useFetchGeneration } from "@/lib/use-fetch-generation";
import { cn } from "@/lib/utils";

type Tab = "pool" | "mine" | "used";

export default function LinksPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("pool");
  const [page, setPage] = useState(1);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [links, setLinks] = useState<OutreachLink[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ pool: 0, claimed: 0, myActive: 0, iUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const memberRef = useRef<TeamMember | null>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { nextGeneration, isLatest } = useFetchGeneration();

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
    async (activeTab: Tab, memberId: string, activePage: number) => {
      const gen = nextGeneration();
      const from = (activePage - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase.from("outreach_links").select("*", { count: "exact" });

      if (activeTab === "pool") {
        query = query
          .eq("status", "available")
          .is("member_id", null)
          .order("created_at", { ascending: false });
      } else if (activeTab === "mine") {
        query = query
          .eq("member_id", memberId)
          .eq("status", "claimed")
          .order("claimed_at", { ascending: false });
      } else {
        query = query
          .eq("used_by_member_id", memberId)
          .eq("status", "used")
          .order("used_at", { ascending: false });
      }

      const { data, count, error } = await query.range(from, to);
      if (!isLatest(gen)) return;
      if (error) {
        setLinks([]);
        setListTotal(0);
        setTotalPages(1);
        return;
      }
      const total = count || 0;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (activePage > pages && total > 0) {
        setPage(pages);
        return;
      }
      setLinks((data as OutreachLink[]) || []);
      setListTotal(total);
      setTotalPages(pages);
    },
    [supabase, pageSize, nextGeneration, isLatest]
  );

  const refresh = useCallback(
    async (activeTab = tab, activePage = page) => {
      const m = await ensureMember();
      if (!m) return;
      await Promise.all([fetchLinks(activeTab, m.id, activePage), fetchStats(m.id)]);
      setLoading(false);
    },
    [ensureMember, fetchLinks, fetchStats, tab, page]
  );

  useEffect(() => {
    setPageSize(readStoredPageSize("inmailly:page-size:team-links"));
  }, []);

  useEffect(() => {
    storePageSize("inmailly:page-size:team-links", pageSize);
  }, [pageSize]);

  useEffect(() => {
    setLoading(true);
    refresh(tab, page);
  }, [tab, page, pageSize, refresh]);

  function selectTab(next: Tab) {
    setTab(next);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel("links-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "outreach_links" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => refresh(tab, page), 400);
      })
      .subscribe();
    return () => {
      clearTimeout(debounce);
      supabase.removeChannel(channel);
    };
  }, [supabase, refresh, tab, page]);

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
    refresh(tab, page);
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
    refresh(tab, page);
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
    refresh(tab, page);
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
        Newest links appear first. Choose <strong className="text-lux-text">10 or 25 per page</strong> below.
        Opened links turn <strong className="text-emerald-400/90">green</strong> so you know what you already visited.
        Always mark <strong className="text-lux-text">Used</strong> after outreach.
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
            onClick={() => selectTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-full border text-[0.8rem] font-bold transition-colors",
              tab === t.id
                ? "team-tab-active"
                : "bg-white/[0.03] text-lux-muted border-white/[0.08] hover:border-[rgba(229,25,55,0.25)]"
            )}
          >
            {t.id === "pool" && "📥 "}
            {t.id === "mine" && "🎯 "}
            {t.id === "used" && "✅ "}
            {t.label} ({t.count})
          </button>
        ))}
        <PageSizeSelect value={pageSize} onChange={handlePageSizeChange} className="w-[7.5rem]" />
        <span className="ml-auto text-xs text-lux-muted tabular-nums">
          Page {page} of {totalPages} · {listTotal} total
        </span>
      </div>

      {loading ? (
        <p className="text-lux-muted text-center py-12">Loading links…</p>
      ) : links.length === 0 ? (
        <div className="lux-card text-center py-12 px-6 border-dashed border-white/[0.12]">
          <div className="text-4xl mb-3">{tab === "pool" ? "📭" : "✨"}</div>
          <p className="text-lux-muted text-sm">
            {tab === "pool"
              ? stats.pool > 0
                ? `Links are in the pool (${stats.pool} total) — try page 1 or refresh.`
                : "No links in the pool right now — ask admin to import more in Team Admin."
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
          <Pagination
            page={page}
            totalPages={totalPages}
            total={listTotal}
            pageSize={pageSize}
            onPage={setPage}
          />
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          themeClass="team-toast-theme"
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
