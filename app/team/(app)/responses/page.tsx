"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeadModal from "@/components/team/LeadModal";
import { createClient } from "@/lib/supabase/client";
import type { Lead, TeamMember } from "@/lib/types";

type LeadWithSnippet = Lead & { lastMessage?: string };

export default function ResponsesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [leads, setLeads] = useState<LeadWithSnippet[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
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

    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("member_id", m.id)
      .in("status", ["replied", "interested"])
      .order("updated_at", { ascending: false });

    const rows = (data as Lead[]) || [];
    if (rows.length === 0) {
      setLeads([]);
      return;
    }

    const leadIds = rows.map((l) => l.id);
    const { data: msgs } = await supabase
      .from("lead_messages")
      .select("lead_id, content, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    const latestByLead = new Map<string, string>();
    for (const msg of msgs || []) {
      if (!latestByLead.has(msg.lead_id)) {
        latestByLead.set(msg.lead_id, msg.content?.slice(0, 120) || "");
      }
    }

    setLeads(
      rows.map((lead) => ({
        ...lead,
        lastMessage: latestByLead.get(lead.id),
      }))
    );
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">💬 Responses</h1>
        <p className="text-lux-muted text-sm mt-1">Leads who replied or showed interest</p>
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="lux-card text-center py-12 text-lux-muted">No active responses yet.</div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="lux-card p-4 hover:border-lux-cyan/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bricolage font-bold text-lux-text">{lead.name}</div>
                  {lead.company && (
                    <div className="text-sm text-lux-muted">{lead.company}</div>
                  )}
                </div>
                <Badge variant={lead.status}>{lead.status}</Badge>
              </div>
              {lead.lastMessage && (
                <p className="text-sm text-lux-muted mt-3 line-clamp-2 italic">
                  &ldquo;{lead.lastMessage}…&rdquo;
                </p>
              )}
              <Button
                variant="lux-ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSelectedLead(lead);
                  setModalOpen(true);
                }}
              >
                View lead
              </Button>
            </div>
          ))
        )}
      </div>

      {member && selectedLead && (
        <LeadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode="view"
          memberId={member.id}
          memberName={member.name}
          lead={selectedLead}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
