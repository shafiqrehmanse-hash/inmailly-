"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { Client, ProjectStatus, TeamMember } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type ProjectRow = {
  id: string;
  client_id: string;
  name: string;
  audience_brief: string | null;
  target_titles: string | null;
  target_industries: string | null;
  target_regions: string | null;
  connection_script: string | null;
  inmail_script: string | null;
  followup_script: string | null;
  status: ProjectStatus;
  portal_token: string | null;
  created_at: string;
  clients: { id: string; name: string; company_name: string | null } | null;
  assignments: { id: string; member_id: string; member: { id: string; name: string; email: string } | null }[];
  assignee_count: number;
};

const EMPTY_PROJECT = {
  client_id: "",
  name: "",
  audience_brief: "",
  target_titles: "",
  target_industries: "",
  target_regions: "",
  connection_script: "",
  inmail_script: "",
  followup_script: "",
  status: "active" as ProjectStatus,
  member_ids: [] as string[],
};

export default function AdminProjectsSection({
  adminKey,
  members,
  onToast,
}: {
  adminKey: string;
  members: TeamMember[];
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [clientFilter, setClientFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [projectForm, setProjectForm] = useState({ ...EMPTY_PROJECT });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const clientsRes = await fetch(`/api/admin/clients?key=${adminKey}`);
    const clientsData = await clientsRes.json();
    setClients(clientsData.clients || []);

    const projectsUrl =
      clientFilter === "all"
        ? `/api/admin/projects?key=${adminKey}`
        : `/api/admin/projects?key=${adminKey}&clientId=${clientFilter}`;
    const projectsRes = await fetch(projectsUrl);
    const projectsData = await projectsRes.json();
    setProjects(projectsData.projects || []);
    setLoading(false);
  }, [adminKey, clientFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProject() {
    if (!projectForm.client_id || !projectForm.name.trim()) {
      onToast("Select a client and enter a project name", "error");
      return;
    }

    const payload = {
      client_id: projectForm.client_id,
      name: projectForm.name,
      audience_brief: projectForm.audience_brief,
      target_titles: projectForm.target_titles,
      target_industries: projectForm.target_industries,
      target_regions: projectForm.target_regions,
      connection_script: projectForm.connection_script,
      inmail_script: projectForm.inmail_script,
      followup_script: projectForm.followup_script,
      status: projectForm.status,
      member_ids: projectForm.member_ids,
    };

    if (editingId) {
      const res = await fetch(`/api/admin/projects?key=${adminKey}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ project_id: editingId, ...payload }),
      });
      const data = await res.json();
      if (data.error) {
        onToast(data.error, "error");
        return;
      }
      onToast("Project updated");
    } else {
      const res = await fetch(`/api/admin/projects?key=${adminKey}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        onToast(data.error, "error");
        return;
      }
      onToast("Project created — team sees it on their hub");
    }

    setProjectForm({ ...EMPTY_PROJECT });
    setEditingId(null);
    load();
  }

  function startEdit(p: ProjectRow) {
    setEditingId(p.id);
    setProjectForm({
      client_id: p.client_id,
      name: p.name,
      audience_brief: p.audience_brief || "",
      target_titles: p.target_titles || "",
      target_industries: p.target_industries || "",
      target_regions: p.target_regions || "",
      connection_script: p.connection_script || "",
      inmail_script: p.inmail_script || "",
      followup_script: p.followup_script || "",
      status: p.status,
      member_ids: p.assignments.map((a) => a.member_id),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleMember(memberId: string) {
    setProjectForm((f) => ({
      ...f,
      member_ids: f.member_ids.includes(memberId)
        ? f.member_ids.filter((id) => id !== memberId)
        : [...f.member_ids, memberId],
    }));
  }

  async function copyClientLink(token: string | null) {
    if (!token) return;
    const url = `${window.location.origin}/client/p/${token}`;
    await navigator.clipboard.writeText(url);
    onToast("Client dashboard link copied");
  }

  if (loading) {
    return <p className="text-lux-muted">Loading projects…</p>;
  }

  return (
    <div className="space-y-8">
      {clients.length === 0 && (
        <div className="lux-card p-4 text-sm text-amber-300 border-amber-500/25">
          Add clients first in the <strong>Clients</strong> sidebar tab, then create projects here.
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="admin-section-title">
            {editingId ? "Edit project" : "Create & assign project"}
          </p>
          {editingId && (
            <button
              type="button"
              className="text-sm text-lux-muted hover:text-lux-cyan"
              onClick={() => {
                setEditingId(null);
                setProjectForm({ ...EMPTY_PROJECT });
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
        <div className="lux-card p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              className="lux-input"
              value={projectForm.client_id}
              onChange={(e) => setProjectForm({ ...projectForm, client_id: e.target.value })}
            >
              <option value="" className="bg-lux-bg">
                Select client *
              </option>
              {clients.filter((c) => c.is_active).map((c) => (
                <option key={c.id} value={c.id} className="bg-lux-bg">
                  {c.company_name || c.name}
                </option>
              ))}
            </select>
            <input
              className="lux-input"
              placeholder="Project name *"
              value={projectForm.name}
              onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
            />
            <select
              className="lux-input"
              value={projectForm.status}
              onChange={(e) =>
                setProjectForm({ ...projectForm, status: e.target.value as ProjectStatus })
              }
            >
              {(["draft", "active", "paused", "completed"] as const).map((s) => (
                <option key={s} value={s} className="bg-lux-bg capitalize">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="lux-input min-h-[90px]"
            placeholder="Audience brief…"
            value={projectForm.audience_brief}
            onChange={(e) => setProjectForm({ ...projectForm, audience_brief: e.target.value })}
          />

          <div className="grid sm:grid-cols-3 gap-3">
            <input
              className="lux-input"
              placeholder="Target titles"
              value={projectForm.target_titles}
              onChange={(e) => setProjectForm({ ...projectForm, target_titles: e.target.value })}
            />
            <input
              className="lux-input"
              placeholder="Industries"
              value={projectForm.target_industries}
              onChange={(e) => setProjectForm({ ...projectForm, target_industries: e.target.value })}
            />
            <input
              className="lux-input"
              placeholder="Regions"
              value={projectForm.target_regions}
              onChange={(e) => setProjectForm({ ...projectForm, target_regions: e.target.value })}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <textarea
              className="lux-input min-h-[100px] text-sm"
              placeholder="Connection script"
              value={projectForm.connection_script}
              onChange={(e) => setProjectForm({ ...projectForm, connection_script: e.target.value })}
            />
            <textarea
              className="lux-input min-h-[100px] text-sm"
              placeholder="InMail script"
              value={projectForm.inmail_script}
              onChange={(e) => setProjectForm({ ...projectForm, inmail_script: e.target.value })}
            />
            <textarea
              className="lux-input min-h-[100px] text-sm"
              placeholder="Follow-up script"
              value={projectForm.followup_script}
              onChange={(e) => setProjectForm({ ...projectForm, followup_script: e.target.value })}
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-lux-muted mb-2">
              Assign team members
            </p>
            <div className="flex flex-wrap gap-2">
              {members.filter((m) => m.is_active).map((m) => {
                const selected = projectForm.member_ids.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selected
                        ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
                        : "bg-white/[0.03] text-lux-muted border-white/[0.08] hover:border-lux-cyan/25"
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Button variant="lux" onClick={saveProject} className="w-full sm:w-auto">
            {editingId ? "Save project" : "Create project"}
          </Button>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="admin-section-title">All projects</p>
          <select
            className="lux-input w-auto text-sm py-2"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            <option value="all" className="bg-lux-bg">
              All clients
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id} className="bg-lux-bg">
                {c.company_name || c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="lux-card p-8 text-center text-lux-muted text-sm">No projects found.</div>
          ) : (
            projects.map((p) => (
              <div key={p.id} className="lux-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bricolage font-extrabold text-lux-text">{p.name}</div>
                    <div className="text-sm text-lux-muted mt-0.5">
                      {p.clients?.company_name || p.clients?.name || "Unknown client"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.65rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-lux-cyan/30 bg-lux-cyan/10 text-lux-cyan capitalize">
                      {p.status}
                    </span>
                    {p.portal_token && (
                      <Button variant="lux-ghost" size="sm" onClick={() => copyClientLink(p.portal_token)}>
                        Copy client link
                      </Button>
                    )}
                    <Button variant="lux-ghost" size="sm" onClick={() => startEdit(p)}>
                      Edit
                    </Button>
                  </div>
                </div>
                {p.audience_brief && (
                  <p className="text-sm text-lux-muted line-clamp-2 mb-3">{p.audience_brief}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-lux-muted/80">
                  <span>{p.assignee_count} assigned</span>
                  <span>Created {formatDate(p.created_at)}</span>
                </div>
                {p.assignments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.assignments.map((a) => (
                      <span
                        key={a.id}
                        className="text-[0.65rem] px-2 py-0.5 rounded-full bg-lux-blue/10 text-lux-cyan border border-lux-blue/20"
                      >
                        {a.member?.name || "Member"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
