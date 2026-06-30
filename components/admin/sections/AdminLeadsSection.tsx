"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import Pagination from "@/components/ui/Pagination";
import PageSizeSelect from "@/components/ui/PageSizeSelect";
import LeadModal from "@/components/team/LeadModal";
import type { Lead, TeamMember } from "@/lib/types";
import { useAdminKey } from "@/lib/admin-context";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";

type LeadRow = Lead & { team_members?: { name: string; email: string } };

export default function AdminLeadsSection() {
  const adminKey = useAdminKey();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [closedOnly, setClosedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
      page: String(page),
      limit: String(pageSize),
      memberId: memberFilter,
      status: statusFilter,
    });
    if (closedOnly) params.set("closedOnly", "1");
    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.pagination?.total ?? 0);
    setTotalPages(data.pagination?.totalPages ?? 1);
  }, [adminKey, memberFilter, statusFilter, closedOnly, page, pageSize]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    setPage(1);
  }, [memberFilter, statusFilter, closedOnly, pageSize]);

  async function closeDeal(lead: LeadRow) {
    await fetch(`/api/admin/leads?key=${adminKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead_id: lead.id, deal_closed: true }),
    });
    loadLeads();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Outreach leads</h1>
        <p className="text-sm text-lux-muted mt-1">
          Your team&apos;s marketing leads only — client campaign responses live under Projects → Campaign responses.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <LuxSelect
          className="w-44"
          size="sm"
          value={memberFilter}
          onChange={setMemberFilter}
          options={[{ value: "all", label: "All members" }, ...members.map((m) => ({ value: m.id, label: m.name }))]}
        />
        <LuxSelect
          className="w-44"
          size="sm"
          value={statusFilter}
          onChange={setStatusFilter}
          options={["all", "new", "contacted", "replied", "interested", "closed", "dead"].map((s) => ({
            value: s,
            label: s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1),
          }))}
        />
        <button
          type="button"
          onClick={() => setClosedOnly((v) => !v)}
          className={`px-3 py-2 rounded-lg text-xs font-bold border ${
            closedOnly ? "bg-amber-500/15 text-amber-300 border-amber-500/40" : "text-lux-muted border-white/[0.08]"
          }`}
        >
          💰 Closed only
        </button>
        <PageSizeSelect value={pageSize} onChange={setPageSize} className="w-32" />
      </div>

      <div className="lux-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-lux-muted text-xs uppercase bg-lux-bg2 border-b border-white/[0.06]">
              <th className="text-left px-4 py-3">Member</th>
              <th className="text-left px-4 py-3">Lead</th>
              <th className="text-left px-4 py-3">Profile</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Notes</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-lux-muted">No outreach leads match.</td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-white/[0.06] hover:bg-lux-bg2/50 cursor-pointer"
                  onClick={() => {
                    setSelectedLead(lead);
                    setModalOpen(true);
                  }}
                >
                  <td className="px-4 py-3 text-lux-cyan text-xs font-semibold">{lead.team_members?.name}</td>
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3">
                    {lead.profile_url ? (
                      <a
                        href={lead.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lux-cyan hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-lux-muted text-xs">{lead.email || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lead.status}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-lux-muted text-xs max-w-[140px] truncate">{lead.notes || "—"}</td>
                  <td className="px-4 py-3 text-lux-muted text-xs">{formatDate(lead.updated_at)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {!lead.deal_closed && (
                      <Button variant="lux-ghost" size="sm" onClick={() => closeDeal(lead)}>
                        💰 Close
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={setPage} />
        </div>
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
