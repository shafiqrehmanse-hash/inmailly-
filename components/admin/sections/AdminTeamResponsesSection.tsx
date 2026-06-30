"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import LeadModal from "@/components/team/LeadModal";
import type { Lead, TeamMember } from "@/lib/types";
import { useAdminKey } from "@/lib/admin-context";

type LeadRow = Lead & {
  team_members?: { name: string; email: string };
  lastMessage?: string;
};

export default function AdminTeamResponsesSection() {
  const adminKey = useAdminKey();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [memberFilter, setMemberFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers((data.members || []).filter((m: TeamMember) => m.role !== "campaign_manager"));
  }, [adminKey]);

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams({
      key: adminKey,
      scope: "outreach",
      status: "all",
      page: "1",
      limit: "50",
      memberId: memberFilter,
    });
    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    const rows = ((data.leads || []) as LeadRow[]).filter((l) =>
      ["replied", "interested"].includes(l.status)
    );

    if (rows.length === 0) {
      setLeads([]);
      return;
    }

    const snippets = await Promise.all(
      rows.map(async (lead) => {
        const msgRes = await fetch(`/api/admin/leads/messages?key=${adminKey}&leadId=${lead.id}`);
        const msgData = await msgRes.json();
        const msgs = (msgData.messages || []) as { content?: string }[];
        const last = msgs[msgs.length - 1];
        return { ...lead, lastMessage: last?.content?.slice(0, 140) };
      })
    );
    setLeads(snippets);
  }, [adminKey, memberFilter]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team responses</h1>
        <p className="text-sm text-lux-muted mt-1">
          Outreach leads who replied — reply here and your team member sees it on their lead thread.
        </p>
      </div>

      <LuxSelect
        className="w-44"
        size="sm"
        value={memberFilter}
        onChange={setMemberFilter}
        options={[{ value: "all", label: "All members" }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
      />

      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="lux-card text-center py-12 text-lux-muted">No active outreach responses.</div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="lux-card p-4 hover:border-lux-cyan/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bricolage font-bold text-lux-text">{lead.name}</div>
                  <div className="text-xs text-lux-cyan mt-0.5">{lead.team_members?.name}</div>
                  {lead.company && <div className="text-sm text-lux-muted">{lead.company}</div>}
                </div>
                <Badge variant={lead.status}>{lead.status}</Badge>
              </div>
              {lead.lastMessage && (
                <p className="text-sm text-lux-muted mt-3 line-clamp-2 italic">&ldquo;{lead.lastMessage}…&rdquo;</p>
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
                Open &amp; reply
              </Button>
            </div>
          ))
        )}
      </div>

      {selectedLead && (
        <LeadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode="view"
          memberId={selectedLead.member_id}
          memberName={selectedLead.team_members?.name || "Team"}
          lead={selectedLead}
          isAdmin
          adminKey={adminKey}
          onSaved={loadLeads}
        />
      )}
    </div>
  );
}
