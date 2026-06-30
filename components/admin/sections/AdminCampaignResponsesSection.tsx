"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import Pagination from "@/components/ui/Pagination";
import PageSizeSelect from "@/components/ui/PageSizeSelect";
import LeadModal from "@/components/team/LeadModal";
import type { Lead } from "@/lib/types";
import { useAdminKey } from "@/lib/admin-context";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

type LeadRow = Lead & {
  team_members?: { name: string };
  projects?: { id: string; name: string; clients?: { name: string; company_name: string } };
  lastMessage?: string;
};

type ProjectOption = { id: string; name: string; client_name?: string };

export default function AdminCampaignResponsesSection() {
  const adminKey = useAdminKey();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    const res = await fetch(`/api/admin/projects?key=${adminKey}&limit=100`);
    const data = await res.json();
    setProjects(
      (data.projects || []).map((p: { id: string; name: string; clients?: { name: string } }) => ({
        id: p.id,
        name: p.name,
        client_name: p.clients?.name,
      }))
    );
  }, [adminKey]);

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams({
      key: adminKey,
      scope: "campaign",
      page: String(page),
      limit: String(pageSize),
      status: statusFilter,
    });
    if (projectFilter !== "all") params.set("projectId", projectFilter);
    const res = await fetch(`/api/admin/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.pagination?.total ?? 0);
    setTotalPages(data.pagination?.totalPages ?? 1);
  }, [adminKey, projectFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    setPage(1);
  }, [projectFilter, statusFilter, pageSize]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Campaign responses</h1>
        <p className="text-sm text-lux-muted mt-1">
          Client project leads from campaign managers — not your internal outreach pool.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <LuxSelect
          className="w-52"
          size="sm"
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            { value: "all", label: "All projects" },
            ...projects.map((p) => ({
              value: p.id,
              label: p.client_name ? `${p.name} (${p.client_name})` : p.name,
            })),
          ]}
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
        <PageSizeSelect value={pageSize} onChange={setPageSize} className="w-32" />
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="lux-card text-center py-12 text-lux-muted">No campaign leads match.</div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="lux-card p-4 hover:border-lux-cyan/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bricolage font-bold text-lux-text">{lead.name}</div>
                  <div className="text-xs text-lux-muted mt-0.5">
                    {lead.projects?.clients?.company_name || lead.projects?.clients?.name || lead.company || "—"}
                    {lead.projects?.name ? ` · ${lead.projects.name}` : ""}
                  </div>
                  <div className="text-xs text-lux-cyan mt-0.5">Manager: {lead.team_members?.name || "—"}</div>
                </div>
                <Badge variant={lead.status}>{lead.status}</Badge>
              </div>
              <Button
                variant="lux-ghost"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSelectedLead(lead);
                  setModalOpen(true);
                }}
              >
                Manage lead
              </Button>
            </div>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPage={setPage} />

      {selectedLead && (
        <LeadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          mode="view"
          memberId={selectedLead.member_id}
          memberName={selectedLead.team_members?.name || "Campaign manager"}
          lead={selectedLead}
          isAdmin
          adminKey={adminKey}
          onSaved={loadLeads}
        />
      )}
    </div>
  );
}
