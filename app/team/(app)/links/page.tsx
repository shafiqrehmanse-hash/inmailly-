"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LinkCard from "@/components/team/LinkCard";
import AutoAssignPanel from "@/components/team/AutoAssignPanel";
import ClaimModeModal from "@/components/team/ClaimModeModal";
import IntelligenceInMailModal from "@/components/team/IntelligenceInMailModal";
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

  const [claimTarget, setClaimTarget] = useState<OutreachLink | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [intelAvailable, setIntelAvailable] = useState<number | null>(null);
  const [intelClaimBlocked, setIntelClaimBlocked] = useState(false);
  const [intelClaimBlockMsg, setIntelClaimBlockMsg] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [intelLink, setIntelLink] = useState<OutreachLink | null>(null);
  const [intelOpen, setIntelOpen] = useState(false);

  const showToast = (message: string, type: ToastType = "success") => setToast({ message, type });

  const ensureMember = useCallback(async () => {
    if (memberRef.current) return memberRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("team_members").select("*").eq("user_id", user.id).single();
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
        supabase.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "available").is("member_id", null),
        supabase.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "claimed"),
        supabase.from("outreach_links").select("*", { count: "exact", head: true }).eq("member_id", memberId).eq("status", "claimed"),
        supabase.from("outreach_links").select("*", { count: "exact", head: true }).eq("used_by_member_id", memberId).eq("status", "used"),
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
        query = query.eq("status", "available").is("member_id", null).order("created_at", { ascending: false });
      } else if (activeTab === "mine") {
        query = query.eq("member_id", memberId).eq("status", "claimed").order("claimed_at", { ascending: false });
      } else {
        query = query.eq("used_by_member_id", memberId).eq("status", "used").order("used_at", { ascending: false });
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

  async function openClaimModal(link: OutreachLink) {
    setClaimTarget(link);
    setClaimOpen(true);
    setIntelAvailable(null);
    setIntelClaimBlocked(false);
    setIntelClaimBlockMsg(null);
    const res = await fetch("/api/team/links/claim");
    if (res.ok) {
      const data = await res.json();
      setIntelAvailable(data.intelligenceAvailable ?? 0);
      setIntelClaimBlocked(Boolean(data.blocked));
      setIntelClaimBlockMsg(data.blockMessage || null);
    } else {
      setIntelAvailable(0);
    }
  }

  async function handleClaimMode(mode: "intelligence" | "usual") {
    if (!claimTarget) return;
    setClaiming(true);
    const res = await fetch("/api/team/links/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId: claimTarget.id, mode }),
    });
    const data = await res.json();
    setClaiming(false);

    if (!res.ok) {
      if (data.code === "FINISH_INTELLIGENCE_FIRST") {
        setIntelClaimBlocked(true);
        setIntelClaimBlockMsg(data.error || null);
        showToast(data.error || "Finish your Intelligence links first", "error");
        return;
      }
      if (data.code === "NO_INTELLIGENCE_LINKS") {
        setIntelAvailable(0);
        showToast("No intelligence links available — upload named links or use Usual", "error");
        return;
      }
      showToast(data.error || "Could not claim link", "error");
      return;
    }

    setClaimOpen(false);
    setClaimTarget(null);
    showToast(mode === "intelligence" ? "Intelligence link claimed ✦" : "Link claimed!");
    setTab("mine");
    setPage(1);
    refresh("mine", 1);

    if (mode === "intelligence" && data.link) {
      setIntelLink(data.link);
      setIntelOpen(true);
    }
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
      .update({
        status: "available",
        member_id: null,
        claimed_at: null,
        outreach_mode: null,
      })
      .eq("id", link.id)
      .eq("member_id", member.id);
    showToast("Link released to pool");
    refresh(tab, page);
  }

  function handleAddLead(link: OutreachLink) {
    const name = [link.first_name, link.last_name].filter(Boolean).join(" ") || link.smart_label || "";
    const params = new URLSearchParams({
      prefill_url: link.url,
      prefill_name: name,
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
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">🔗 Outreach Links</h1>
        <p className="text-lux-muted text-[0.88rem] mt-2 leading-relaxed max-w-2xl">
          Use the buttons below to get <strong className="text-lux-text">Usual</strong> or{" "}
          <strong className="text-lux-text">Intelligence</strong> links, finish outreach, then mark complete.
        </p>
      </div>

      <AutoAssignPanel
        onToast={(message, type) => showToast(message, type || "success")}
        onAssigned={() => {
          setTab("mine");
          setPage(1);
          refresh("mine", 1);
        }}
      />

      <div className="lux-card-elite p-4 text-lux-muted text-[0.84rem] leading-relaxed">
        <strong className="text-lux-cyan text-[0.7rem] uppercase tracking-wide block mb-1.5">✦ Intelligence tips</strong>
        On an Intelligence link, click <strong className="text-lux-text">Paste screenshot</strong>. Open the profile,
        crop with <strong className="text-lux-text">Win+Shift+S</strong>, then <strong className="text-lux-text">Ctrl+V</strong>{" "}
        (or upload / drag a PNG). AI writes the InMail — copy, send on LinkedIn, mark complete.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={stats.pool} label="Available" />
        <StatCard value={stats.claimed} label="Claimed (team)" />
        <StatCard value={stats.myActive} label="Your active" />
        <StatCard value={stats.iUsed} label="You used" />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => selectTab(t.id)} className={cn("lux-tab-pill", tab === t.id && "lux-tab-pill-active")}>
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="lux-skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="lux-card-elite text-center py-14 px-6 border-dashed border-lux-cyan/20">
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
              onClaim={() => openClaimModal(link)}
              onMarkUsed={() => handleMarkUsed(link)}
              onRelease={() => handleRelease(link)}
              onAddLead={() => handleAddLead(link)}
              onIntelligenceInMail={() => {
                setIntelLink(link);
                setIntelOpen(true);
              }}
            />
          ))}
          <Pagination page={page} totalPages={totalPages} total={listTotal} pageSize={pageSize} onPage={setPage} />
        </div>
      )}

      <ClaimModeModal
        open={claimOpen}
        onClose={() => {
          if (!claiming) {
            setClaimOpen(false);
            setClaimTarget(null);
          }
        }}
        onChoose={handleClaimMode}
        intelligenceAvailable={intelAvailable}
        intelligenceBlocked={intelClaimBlocked}
        intelligenceBlockMessage={intelClaimBlockMsg}
        checking={claiming || intelAvailable === null}
      />

      <IntelligenceInMailModal
        open={intelOpen}
        link={intelLink}
        onClose={() => {
          setIntelOpen(false);
          setIntelLink(null);
        }}
        onCompleted={() => {
          setIntelOpen(false);
          setIntelLink(null);
          showToast("Marked complete — great send ✦");
          refresh("mine", page);
        }}
      />

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
