"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import LuxSelect from "@/components/ui/LuxSelect";
import { createClient } from "@/lib/supabase/client";
import type { AssignedProject, Lead } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { key: "replied", label: "Replied" },
  { key: "interested", label: "Interested" },
  { key: "contacted", label: "Contacted" },
  { key: "follow_up", label: "Follow Up" },
  { key: "new", label: "New" },
] as const;

export default function ProjectClientWorkspace({
  project,
}: {
  project: AssignedProject;
  memberId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [responses, setResponses] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company: "",
    profile_url: "",
    status: "replied" as Lead["status"],
    notes: "",
  });

  const portalUrl =
    project.portal_token && typeof window !== "undefined"
      ? `${window.location.origin}/client/p/${project.portal_token}`
      : project.portal_token
        ? `/client/p/${project.portal_token}`
        : null;

  const visibleCount = responses.filter((r) => r.visible_to_client).length;

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });
    setResponses((data as Lead[]) || []);
    setLoading(false);
  }, [supabase, project.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitResponse(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setMsg({ text: "First and last name are required.", type: "error" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/campaign/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: project.id,
        first_name: form.first_name,
        last_name: form.last_name,
        company: form.company,
        profile_url: form.profile_url,
        status: form.status,
        notes: form.notes,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg({ text: data.error || "Failed to log response", type: "error" });
      return;
    }
    setMsg({
      text: data.notified
        ? "Response sent to client dashboard — email notification sent."
        : "Response sent to client dashboard.",
      type: "success",
    });
    setForm({
      first_name: "",
      last_name: "",
      company: "",
      profile_url: "",
      status: "replied",
      notes: "",
    });
    load();
  }

  async function toggleResponseVisible(id: string, visible: boolean) {
    await fetch("/api/campaign/responses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, visible_to_client: visible }),
    });
    load();
  }

  async function removeResponse(id: string) {
    if (!confirm("Remove this response from the client dashboard?")) return;
    await fetch(`/api/campaign/responses?id=${id}`, { method: "DELETE" });
    load();
  }

  async function copyPortalLink() {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setMsg({ text: "Team portal link copied (internal view)", type: "success" });
    } catch {
      setMsg({ text: "Could not copy link", type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="lux-card p-5 sm:p-6 border-lux-cyan/25">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-lux-cyan font-semibold mb-1">
              Client dashboard
            </p>
            <h2 className="font-bricolage font-extrabold text-lg text-lux-text">
              Log responses for your client
            </h2>
            <p className="text-sm text-lux-muted mt-2 max-w-xl leading-relaxed">
              Clients get an <strong className="text-lux-text">email when you log a response</strong>.
              Screenshot uploads do not email the client. Hide or remove items below to adjust what they see.
            </p>
          </div>
          {portalUrl && (
            <div className="flex flex-wrap gap-2">
              <Link href={portalUrl} target="_blank" className="lux-btn-primary text-sm px-4 py-2.5">
                Open team portal ↗
              </Link>
              <button type="button" onClick={copyPortalLink} className="lux-btn-ghost text-sm px-4 py-2.5">
                Copy team link
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">
        <div className="lux-card p-5 sm:p-6">
          <h3 className="font-bricolage font-bold text-lux-text mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-lux-cyan rounded-sm" />
            Log client response
          </h3>
          {msg && (
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium mb-4",
                msg.type === "success"
                  ? "bg-lux-cyan/10 text-lux-cyan border border-lux-cyan/25"
                  : "bg-red-500/10 text-red-400 border border-red-500/25"
              )}
            >
              {msg.text}
            </div>
          )}
          <form onSubmit={submitResponse} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="First name *" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
              <Field label="Last name *" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
            </div>
            <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="LinkedIn URL" value={form.profile_url} onChange={(v) => setForm({ ...form, profile_url: v })} />
            <div>
              <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">Status</label>
              <LuxSelect
                className="mt-1"
                value={form.status}
                onChange={(status) => setForm({ ...form, status: status as Lead["status"] })}
                options={STATUS_OPTIONS.map((s) => ({ value: s.key, label: s.label }))}
              />
            </div>
            <div>
              <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">
                What they said *
              </label>
              <textarea
                className="lux-input mt-1 min-h-[100px] text-sm w-full"
                placeholder="Paste their reply or summarize the conversation…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                required
              />
            </div>
            <button type="submit" disabled={saving} className="w-full lux-btn-primary py-3 font-bricolage font-extrabold disabled:opacity-50">
              {saving ? "Sending…" : "Send to client dashboard →"}
            </button>
          </form>
        </div>

        <div className="lux-card p-5 sm:p-6 min-w-0">
          <h3 className="font-bricolage font-bold text-lux-text mb-1">
            Client responses ({visibleCount} shown · {responses.length} total)
          </h3>
          <p className="text-xs text-lux-muted mb-4">Uncheck &quot;Client&quot; to hide from dashboard without deleting.</p>
          {loading ? (
            <p className="text-lux-muted text-sm">Loading…</p>
          ) : responses.length === 0 ? (
            <div className="text-center py-10 text-lux-muted text-sm">
              <div className="text-3xl mb-2">💬</div>
              No client responses yet. Log the first reply above.
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto">
              {responses.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "bg-white/[0.03] border rounded-xl p-4",
                    r.visible_to_client ? "border-white/[0.08]" : "border-red-500/20 opacity-75"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-lux-text">{r.name}</div>
                      {r.company && <div className="text-xs text-lux-muted">{r.company}</div>}
                    </div>
                    <Badge variant={r.status as Parameters<typeof Badge>[0]["variant"]}>{r.status}</Badge>
                  </div>
                  {r.notes && (
                    <p className="text-sm text-lux-muted italic leading-relaxed">&ldquo;{r.notes}&rdquo;</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                    <div className="text-[0.65rem] text-lux-muted/70">{formatDate(r.created_at)}</div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[0.65rem] text-lux-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.visible_to_client}
                          onChange={(e) => toggleResponseVisible(r.id, e.target.checked)}
                          className="rounded border-white/20"
                        />
                        Client
                      </label>
                      <button
                        type="button"
                        className="text-[0.65rem] text-red-400/80 hover:text-red-400"
                        onClick={() => removeResponse(r.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">{label}</label>
      <input
        className="lux-input mt-1 text-sm py-2.5 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
