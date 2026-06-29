"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import LeadCard from "@/components/team/LeadCard";
import LeadModal from "@/components/team/LeadModal";
import { createClient } from "@/lib/supabase/client";
import type { Lead, TeamMember } from "@/lib/types";

const STATUSES = ["all", "new", "contacted", "replied", "interested", "closed", "dead"];
const PAGE_SIZE = 25;

function LeadsContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [msgCounts, setMsgCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "view">("add");
  const [prefill, setPrefill] = useState<{
    name?: string;
    url?: string;
    source_link_id?: string;
  }>();

  const fetchLeads = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (!m) return;
    setMember(m as TeamMember);

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("member_id", m.id)
      .order("updated_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, count } = await query;
    setLeads((data as Lead[]) || []);
    setTotal(count || 0);

    if (data?.length) {
      const counts: Record<string, number> = {};
      for (const lead of data) {
        const { count: mc } = await supabase
          .from("lead_messages")
          .select("*", { count: "exact", head: true })
          .eq("lead_id", lead.id);
        counts[lead.id] = mc || 0;
      }
      setMsgCounts(counts);
    }
  }, [supabase, statusFilter, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const url = searchParams.get("prefill_url");
    const name = searchParams.get("prefill_name");
    const sourceId = searchParams.get("source_link_id");
    if (url || name) {
      setPrefill({ url: url || undefined, name: name || undefined, source_link_id: sourceId || undefined });
      setModalMode("add");
      setModalOpen(true);
    }
  }, [searchParams]);

  function openAdd() {
    setSelectedLead(null);
    setPrefill(undefined);
    setModalMode("add");
    setModalOpen(true);
  }

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setModalMode("view");
    setModalOpen(true);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bricolage font-extrabold text-2xl">◫ My Leads</h1>
          <p className="text-mid text-sm mt-1">Track conversations and deal status</p>
        </div>
        <Button onClick={openAdd}>+ Add lead</Button>
      </div>

      <div className="flex gap-3">
        <select
          className="input-field w-auto text-sm py-2"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-card capitalize">
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <p className="text-mid text-center py-12">No leads yet.</p>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              messageCount={msgCounts[lead.id]}
              onClick={() => openLead(lead)}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-mid">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {member && (
        <LeadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode={modalMode}
          memberId={member.id}
          memberName={member.name}
          lead={selectedLead}
          prefill={prefill}
          onSaved={fetchLeads}
        />
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsContent />
    </Suspense>
  );
}
