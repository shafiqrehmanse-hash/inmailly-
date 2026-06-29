"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { Client } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AdminClientsSection({
  adminKey,
  onToast,
}: {
  adminKey: string;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [clients, setClients] = useState<(Client & { project_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", company_name: "", email: "", notes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", company_name: "", email: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/clients?key=${adminKey}`);
    const data = await res.json();
    setClients(data.clients || []);
    setLoading(false);
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

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

  async function removeClient(id: string, name: string) {
    if (!confirm(`Remove client "${name}"? They must have no projects first.`)) return;
    const res = await fetch(`/api/admin/clients?key=${adminKey}&clientId=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.error) {
      onToast(data.error, "error");
      return;
    }
    onToast("Client removed");
    load();
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

  return (
    <div className="space-y-8">
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

      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="admin-section-title">All clients</p>
          <span className="text-xs text-lux-muted">{clients.length} total</span>
        </div>
        <div className="space-y-3">
          {clients.length === 0 ? (
            <div className="lux-card p-8 text-center text-lux-muted text-sm">No clients yet.</div>
          ) : (
            clients.map((c) => (
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
                          onClick={() => removeClient(c.id, c.company_name || c.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-lux-muted">
                      <span>{c.project_count || 0} projects</span>
                      <span>Added {formatDate(c.created_at)}</span>
                      <button
                        type="button"
                        className="text-lux-cyan hover:underline"
                        onClick={() => toggleActive(c)}
                      >
                        {c.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                    {c.notes && (
                      <p className="text-sm text-lux-muted mt-2 line-clamp-2">{c.notes}</p>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
