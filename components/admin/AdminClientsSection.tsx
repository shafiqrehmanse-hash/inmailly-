"use client";

import { useCallback, useEffect, useState } from "react";
import AdminClientEmailPanel from "@/components/admin/AdminClientEmailPanel";
import AdminClientBrandingPanel from "@/components/admin/AdminClientBrandingPanel";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import PageSizeSelect from "@/components/ui/PageSizeSelect";
import type { Client } from "@/lib/types";
import { DEFAULT_PAGE_SIZE, readStoredPageSize, storePageSize } from "@/lib/pagination";
import { formatDate } from "@/lib/utils";

type DeleteClientTarget = {
  id: string;
  name: string;
  projectCount: number;
  email?: string | null;
};

export default function AdminClientsSection({
  adminKey,
  onToast,
  onOpenProjects,
  setupOnly = false,
  emailFocus = false,
}: {
  adminKey: string;
  onToast: (msg: string, type?: "success" | "error") => void;
  onOpenProjects?: (clientId: string) => void;
  setupOnly?: boolean;
  emailFocus?: boolean;
}) {
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [clients, setClients] = useState<
    (Client & {
      project_count?: number;
      latest_project?: {
        id: string;
        name: string;
        status: string;
        portal_token: string | null;
        inmail_package_size: number | null;
        assignee_count?: number;
        branding_pending?: boolean;
        branding_submitted?: boolean;
        inmail_subject?: string | null;
        inmail_script?: string | null;
        sales_nav_direct_link?: string | null;
        sales_nav_link_count?: number | null;
        branding_submitted_at?: string | null;
      } | null;
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [form, setForm] = useState({ name: "", company_name: "", email: "", notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", company_name: "", email: "", notes: "" });
  const [deleteTarget, setDeleteTarget] = useState<DeleteClientTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/clients?key=${adminKey}&page=${page}&limit=${pageSize}`
    );
    const data = await res.json();
    setClients(data.clients || []);
    setTotal(data.pagination?.total ?? data.clients?.length ?? 0);
    setTotalPages(data.pagination?.totalPages ?? 1);
    setLoading(false);
  }, [adminKey, page, pageSize]);

  useEffect(() => {
    setPageSize(readStoredPageSize("inmailly:page-size:admin-clients"));
  }, []);

  useEffect(() => {
    storePageSize("inmailly:page-size:admin-clients", pageSize);
  }, [pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

  async function createClient() {
    if (!form.name.trim()) {
      onToast("Client name is required", "error");
      return;
    }
    const res = await fetch(`/api/admin/clients?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) {
      onToast(data.error, "error");
      return;
    }
    onToast("Client added");
    setForm({ name: "", company_name: "", email: "", notes: "" });
    setPage(1);
    load();
  }

  async function saveEdit() {
    if (!editingId) return;
    const res = await fetch(`/api/admin/clients?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ client_id: editingId, ...editForm }),
    });
    const data = await res.json();
    if (data.error) {
      onToast(data.error, "error");
      return;
    }
    onToast("Client updated");
    setEditingId(null);
    load();
  }

  async function confirmDeleteClient() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/clients?key=${adminKey}&clientId=${deleteTarget.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    setDeleting(false);
    if (data.error) {
      onToast(data.error, "error");
      return;
    }
    const freed = data.email ? ` ${data.email} can register again.` : "";
    const projects =
      data.projectsDeleted > 0
        ? ` Removed ${data.projectsDeleted} project${data.projectsDeleted === 1 ? "" : "s"}.`
        : "";
    onToast(`Client deleted.${projects}${freed}`);
    setDeleteTarget(null);
    load();
  }

  function requestDeleteClient(target: DeleteClientTarget) {
    setDeleteTarget(target);
  }

  async function copyPortalLink(token: string) {
    const url = `${window.location.origin}/client/p/${token}`;
    await navigator.clipboard.writeText(url);
    onToast("Team portal link copied (internal — real data only)");
  }

  async function copyLoginHint() {
    const url = `${window.location.origin}/client/login`;
    await navigator.clipboard.writeText(url);
    onToast("Client login URL copied");
  }

  async function toggleActive(client: Client) {
    const res = await fetch(`/api/admin/clients?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ client_id: client.id, is_active: !client.is_active }),
    });
    if (res.ok) load();
  }

  if (loading) return <p className="text-lux-muted">Loading clients…</p>;

  const visibleClients = setupOnly
    ? clients.filter((c) => {
        if (c.signup_source !== "self") return false;
        const lp = c.latest_project;
        if (!lp) return true;
        const assignees = lp.assignee_count ?? 0;
        const ready = lp.status === "active" && assignees > 0 && Boolean(lp.inmail_package_size);
        return !ready;
      })
    : clients;

  return (
    <div className="space-y-8">
      {!setupOnly && !emailFocus && (
      <section>
        <p className="admin-section-title mb-4">Add client</p>
        <div className="lux-card p-5 grid sm:grid-cols-2 gap-3">
          <input
            className="lux-input"
            placeholder="Contact name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="lux-input"
            placeholder="Company name"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
          <input
            className="lux-input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="lux-input"
            placeholder="Internal notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <Button variant="lux" onClick={createClient} className="sm:col-span-2 w-full sm:w-auto">
            Add client
          </Button>
        </div>
      </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="admin-section-title">
            {setupOnly ? "Clients needing setup" : emailFocus ? "Send campaign email" : "All clients"}
          </p>
          {!setupOnly && (
          <div className="flex items-center gap-3">
            <PageSizeSelect value={pageSize} onChange={handlePageSizeChange} />
            <span className="text-xs text-lux-muted tabular-nums">{total} total · page {page} of {totalPages}</span>
          </div>
          )}
        </div>
        <div className="space-y-3">
          {visibleClients.length === 0 ? (
            <div className="lux-card p-8 text-center text-lux-muted text-sm">
              {setupOnly ? "No clients need setup right now." : "No clients yet."}
            </div>
          ) : (
            visibleClients.map((c) => (
              <div key={c.id} className="lux-card p-5">
                {editingId === c.id ? (
                  <div className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        className="lux-input"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <input
                        className="lux-input"
                        value={editForm.company_name}
                        onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                      />
                      <input
                        className="lux-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                      <input
                        className="lux-input"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="lux" size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button variant="lux-ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-bricolage font-extrabold text-lux-text">
                          {c.company_name || c.name}
                        </div>
                        {c.company_name && (
                          <div className="text-sm text-lux-muted">{c.name}</div>
                        )}
                        {c.email && <div className="text-xs text-lux-muted mt-1">{c.email}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.signup_source === "self" && (
                          <span className="text-[0.6rem] uppercase font-bold px-2 py-0.5 rounded-full border text-lux-cyan border-lux-cyan/30">
                            Self signup
                          </span>
                        )}
                        <span
                          className={`text-[0.6rem] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            c.is_active
                              ? "text-emerald-400 border-emerald-500/30"
                              : "text-lux-muted border-white/[0.12]"
                          }`}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                        <Button
                          variant="lux-ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditForm({
                              name: c.name,
                              company_name: c.company_name || "",
                              email: c.email || "",
                              notes: c.notes || "",
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="lux-ghost"
                          size="sm"
                          className="text-red-400/90 hover:text-red-300"
                          onClick={() =>
                            requestDeleteClient({
                              id: c.id,
                              name: c.company_name || c.name,
                              projectCount: c.project_count || 0,
                              email: c.email,
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-lux-muted items-center">
                      <span>{c.project_count || 0} projects</span>
                      <span>Added {formatDate(c.created_at)}</span>
                      {onOpenProjects && (
                        <button
                          type="button"
                          className="text-lux-cyan hover:underline font-semibold"
                          onClick={() => onOpenProjects(c.id)}
                        >
                          Open projects →
                        </button>
                      )}
                      {c.signup_source === "self" && c.latest_project?.portal_token && (
                        <>
                          <button
                            type="button"
                            className="text-lux-cyan hover:underline"
                            onClick={() => copyPortalLink(c.latest_project!.portal_token!)}
                          >
                            Copy team portal link
                          </button>
                          <button
                            type="button"
                            className="text-lux-cyan hover:underline"
                            onClick={copyLoginHint}
                          >
                            Copy login URL
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="text-lux-cyan hover:underline"
                        onClick={() => toggleActive(c)}
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    {c.signup_source === "self" && c.latest_project && (
                      <OnboardingChecklist project={c.latest_project} />
                    )}
                    {c.signup_source === "self" && (
                      <p className="text-xs text-lux-muted mt-3 border-t border-white/[0.06] pt-3 leading-relaxed">
                        <strong className="text-lux-cyan">Self signup</strong> — client sees an empty preview until you
                        open <strong className="text-lux-text">Projects</strong>, edit their campaign (scripts,
                        audience), assign a campaign manager, and set status to{" "}
                        <strong className="text-lux-text">Active</strong>. Clients use{" "}
                        <code className="text-lux-cyan/80">/client/login</code> for their dashboard. Token links
                        are for team/internal access only.
                      </p>
                    )}
                    {c.notes && (
                      <p className="text-sm text-lux-muted mt-2 line-clamp-2">{c.notes}</p>
                    )}
                    <AdminClientBrandingPanel
                      projectId={c.latest_project?.id}
                      branding={c.latest_project}
                    />
                    <AdminClientEmailPanel
                      defaultOpen={emailFocus}
                      client={{
                        id: c.id,
                        name: c.name,
                        email: c.email,
                        company_name: c.company_name,
                        latest_project: c.latest_project
                          ? {
                              id: c.latest_project.id,
                              name: c.latest_project.name,
                              status: c.latest_project.status,
                            }
                          : null,
                      }}
                      adminKey={adminKey}
                      onToast={onToast}
                      onProjectUpdated={load}
                    />
                  </>
                )}
              </div>
            ))
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPage={setPage}
        />
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete client?"
        destructive
        confirmLabel="Delete client"
        loading={deleting}
        onConfirm={confirmDeleteClient}
        description={
          deleteTarget ? (
            <>
              <p className="mb-3">
                You are about to permanently delete <strong className="text-lux-text">{deleteTarget.name}</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                {deleteTarget.projectCount > 0 ? (
                  <li>
                    {deleteTarget.projectCount} project{deleteTarget.projectCount === 1 ? "" : "s"} and all related
                    data
                  </li>
                ) : (
                  <li>All client records and service agreements</li>
                )}
                <li>Assignments, leads, proofs, and contracts tied to this client</li>
                {deleteTarget.email ? (
                  <li>
                    Login for <strong className="text-lux-text">{deleteTarget.email}</strong> — email will be free for a
                    new signup
                  </li>
                ) : (
                  <li>Any linked login account</li>
                )}
              </ul>
              <p className="mt-3 text-amber-300/90">This cannot be undone.</p>
            </>
          ) : null
        }
      />
    </div>
  );
}

function OnboardingChecklist({
  project,
}: {
  project: {
    status: string;
    inmail_package_size: number | null;
    assignee_count?: number;
  };
}) {
  const steps = [
    { done: project.status === "active", label: "Campaign set to Active" },
    { done: (project.assignee_count || 0) > 0, label: "Campaign manager assigned" },
    { done: Boolean(project.inmail_package_size), label: "InMail package size set" },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <div className="mt-3 border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 rounded-lg">
      <p className="text-[0.65rem] uppercase tracking-wider text-amber-300 font-bold mb-2">
        Onboarding · {doneCount}/{steps.length} complete
      </p>
      <ul className="space-y-1">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span className={s.done ? "text-emerald-400" : "text-lux-muted"}>{s.done ? "✓" : "○"}</span>
            <span className={s.done ? "text-lux-muted line-through" : "text-lux-text"}>{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
