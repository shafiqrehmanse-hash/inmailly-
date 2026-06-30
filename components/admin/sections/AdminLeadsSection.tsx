"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import LuxSelect from "@/components/ui/LuxSelect";
import LeadModal from "@/components/team/LeadModal";
import type { Lead, TeamMember } from "@/lib/types";
import { useAdminKey } from "@/lib/admin-context";
import { formatDate } from "@/lib/utils";

export default function AdminLeadsSection() {
  const adminKey = useAdminKey();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [adminLeads, setAdminLeads] = useState<(Lead & { team_members?: { name: string; email: string } })[]>([]);
  const [leadMemberFilter, setLeadMemberFilter] = useState("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers(data.members || []);
  }, [adminKey]);

  const loadLeads = useCallback(async () => {
    const res = await fetch(
      `/api/admin/leads?key=${adminKey}&memberId=${leadMemberFilter === "all" ? "" : leadMemberFilter}&status=${leadStatusFilter}`
    );
    const data = await res.json();
    setAdminLeads(data.leads || []);
  }, [adminKey, leadMemberFilter, leadStatusFilter]);

  useEffect(() => {
    loadMembers();
    loadLeads();
  }, [loadMembers, loadLeads]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">All leads</h1>
        <p className="text-sm text-lux-muted mt-1">Filter by member, status, or closed deals.</p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <LuxSelect
          className="w-44"
          size="sm"
          value={leadMemberFilter}
          onChange={setLeadMemberFilter}
          options={[{ value: "all", label: "All members" }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
        />
        <LuxSelect
          className="w-44"
          size="sm"
          value={leadStatusFilter}
          onChange={setLeadStatusFilter}
          options={["all", "new", "contacted", "replied", "interested", "closed", "dead"].map((s) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
          }))}
        />
      </div>
      <div className="lux-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Member</th>
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {adminLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-lux-muted">No leads match this filter.</td>
              </tr>
            ) : (
              adminLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.06] hover:bg-lux-bg2 cursor-pointer"
                  onClick={() => {
                    setSelectedLead(lead);
                    setLeadModalOpen(true);
                  }}
                >
                  <td className="px-4 py-3">{lead.name}</td>
                  <td className="px-4 py-3 text-lux-muted">{lead.team_members?.name}</td>
                  <td className="px-4 py-3">{lead.company || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lead.status}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-lux-muted text-xs">{formatDate(lead.updated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selectedLead && (
        <LeadModal
          open={leadModalOpen}
          onClose={() => setLeadModalOpen(false)}
          mode="view"
          memberId={selectedLead.member_id}
          memberName="Admin"
          lead={selectedLead}
          isAdmin
          onSaved={loadLeads}
        />
      )}
    </div>
  );
}
