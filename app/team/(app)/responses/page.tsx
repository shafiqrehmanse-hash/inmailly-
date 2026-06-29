"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LeadModal from "@/components/team/LeadModal";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadMessage, TeamMember } from "@/lib/types";

type LeadWithSnippet = Lead & { lastMessage?: string };

export default function ResponsesPage() {
  const supabase = createClient();
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

    const withSnippets: LeadWithSnippet[] = [];
    for (const lead of (data as Lead[]) || []) {
      const { data: msgs } = await supabase
        .from("lead_messages")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false })
        .limit(1);
      withSnippets.push({
        ...lead,
        lastMessage: (msgs?.[0] as LeadMessage)?.content?.slice(0, 120),
      });
    }
    setLeads(withSnippets);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl">💬 Responses</h1>
        <p className="text-mid text-sm mt-1">Leads who replied or showed interest</p>
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <p className="text-mid text-center py-12">No active responses yet.</p>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="card-dark p-4 hover:shadow-card hover:border-ind/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bricolage font-bold">{lead.name}</div>
                  {lead.company && (
                    <div className="text-sm text-mid">{lead.company}</div>
                  )}
                </div>
                <Badge variant={lead.status}>{lead.status}</Badge>
              </div>
              {lead.lastMessage && (
                <p className="text-sm text-mid mt-3 line-clamp-2 italic">
                  &ldquo;{lead.lastMessage}…&rdquo;
                </p>
              )}
              <Button
                variant="ghost"
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
