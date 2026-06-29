"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import LeadModal from "@/components/team/LeadModal";
import StatCard from "@/components/team/StatCard";
import { createClient } from "@/lib/supabase/client";
import type { Lead, TeamMember } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "replied", label: "Replied" },
  { key: "interested", label: "Interested" },
  { key: "not_interested", label: "Not Interested" },
  { key: "follow_up", label: "Follow Up" },
] as const;

const STATUS_OPTIONS = STATUS_FILTERS.filter((s) => s.key !== "all");

function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

function LeadsWorkspaceInner() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [msgCounts, setMsgCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, today: 0, interested: 0, replied: 0, closed: 0 });
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    profile_url: "",
    email: "",
    phone: "",
    status: "new" as Lead["status"],
    notes: "",
  });
  const [formMsg, setFormMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalLead, setModalLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase.from("team_members").select("*").eq("user_id", user.id).single();
    if (!m) return;
    setMember(m as TeamMember);

    const today = new Date().toISOString().slice(0, 10);
    const [allLeads, todayC, intC, repC, closedC] = await Promise.all([
      supabase
        .from("leads")
        .select("*")
        .eq("member_id", m.id)
        .is("project_id", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
        .is("project_id", null)
        .gte("created_at", `${today}T00:00:00`),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
        .is("project_id", null)
        .eq("status", "interested"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
        .is("project_id", null)
        .eq("status", "replied"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
        .is("project_id", null)
        .eq("deal_closed", true),
    ]);

    const rows = (allLeads.data as Lead[]) || [];
    setLeads(rows);
    setStats({
      total: rows.length,
      today: todayC.count || 0,
      interested: intC.count || 0,
      replied: repC.count || 0,
      closed: closedC.count || 0,
    });

    const leadIds = rows.map((l) => l.id);
    const counts: Record<string, number> = {};
    if (leadIds.length > 0) {
      const { data: msgs } = await supabase.from("lead_messages").select("lead_id").in("lead_id", leadIds);
      for (const msg of msgs || []) {
        counts[msg.lead_id] = (counts[msg.lead_id] || 0) + 1;
      }
    }
    setMsgCounts(counts);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const url = searchParams.get("prefill_url");
    const name = searchParams.get("prefill_name");
    if (url || name) {
      const { first, last } = splitName(name || "");
      setForm((f) => ({
        ...f,
        first_name: first,
        last_name: last,
        profile_url: url || f.profile_url,
      }));
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((l) => l.status === filter);
  }, [leads, filter]);

  async function addLead(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormMsg({ text: "First name and last name are required.", type: "error" });
      return;
    }
    setSaving(true);
    const name = `${form.first_name.trim()} ${form.last_name.trim()}`;
    const { error } = await supabase.from("leads").insert({
      member_id: member.id,
      project_id: null,
      visible_to_client: false,
      name,
      profile_url: form.profile_url || null,
      email: form.email || null,
      phone: form.phone || null,
      status: form.status,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) {
      setFormMsg({ text: error.message, type: "error" });
      return;
    }
    setFormMsg({ text: "Lead added successfully!", type: "success" });
    setForm({
      first_name: "",
      last_name: "",
      profile_url: "",
      email: "",
      phone: "",
      status: "new",
      notes: "",
    });
    load();
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead permanently?")) return;
    await supabase.from("leads").delete().eq("id", id);
    load();
  }

  const prefillFromUrl = searchParams.get("prefill_url");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">My Marketing Leads</h1>
        <p className="text-[0.8rem] text-lux-muted mt-1">
          Your personal outreach pool — separate from client projects. For client work, open{" "}
          <Link href="/team/hub" className="text-lux-cyan font-semibold hover:underline">
            My Projects
          </Link>{" "}
          and log responses there.
        </p>
      </div>

      {prefillFromUrl && (
        <div className="bg-lux-cyan/10 border border-lux-cyan/25 text-lux-cyan rounded-xl px-4 py-3 text-sm font-medium">
          Adding lead from outreach link — profile URL is filled in below.
        </div>
      )}

      {stats.closed > 0 && (
        <div className="rounded-2xl lux-card border-amber-500/30 p-5">
          <div className="flex items-center gap-4">
            <span className="text-4xl">💰</span>
            <div>
              <div className="font-bricolage font-extrabold text-xl text-lux-text">
                {stats.closed} Deal{stats.closed > 1 ? "s" : ""} Closed!
              </div>
              <div className="text-sm text-lux-muted mt-0.5">Keep crushing it</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard value={stats.total} label="Total leads" />
        <StatCard value={stats.today} label="Added today" />
        <StatCard value={stats.interested} label="Interested" />
        <StatCard value={stats.replied} label="Replied" />
        <StatCard value={stats.closed} label="Deals closed" />
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
        <div className="lux-card p-5 sm:p-6">
          <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2 mb-5 text-lux-text">
            <span className="w-1 h-5 bg-lux-cyan rounded-sm" />
            Add New Lead
          </h2>
          {formMsg && (
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium mb-4",
                formMsg.type === "success"
                  ? "bg-lux-cyan/10 text-lux-cyan border border-lux-cyan/25"
                  : "bg-red-500/10 text-red-400 border border-red-500/25"
              )}
            >
              {formMsg.text}
            </div>
          )}
          <form onSubmit={addLead} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="First name *" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
              <Field label="Last name *" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
            </div>
            <Field label="LinkedIn profile link" value={form.profile_url} onChange={(v) => setForm({ ...form, profile_url: v })} />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            <div>
              <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">Response status</label>
              <select
                className="lux-input mt-1 text-sm w-full"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Lead["status"] })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">Notes / what they said</label>
              <textarea
                className="lux-input mt-1 min-h-[80px] text-sm w-full"
                placeholder="Write what happened, their response…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 lux-btn-primary rounded-xl font-bricolage font-extrabold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add Lead →"}
            </button>
          </form>
        </div>

        <div className="lux-card p-5 sm:p-6 min-w-0">
          <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2 mb-4 text-lux-text">
            <span className="w-1 h-5 bg-lux-cyan rounded-sm" />
            My Lead List ({filtered.length})
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilter(s.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full border text-[0.78rem] font-semibold transition-colors",
                  filter === s.key
                    ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
                    : "bg-white/[0.03] text-lux-muted border-white/[0.08] hover:border-lux-cyan/25"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-lux-muted">
              <div className="text-4xl mb-3">📋</div>
              <p>No leads yet. Add your first lead from the form!</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="text-[0.68rem] font-bold uppercase tracking-wide text-lux-muted bg-white/[0.03] border-b border-white/[0.08]">
                    <th className="text-left px-3 py-2.5">Name</th>
                    <th className="text-left px-3 py-2.5">Profile</th>
                    <th className="text-left px-3 py-2.5">Status</th>
                    <th className="text-left px-3 py-2.5 hidden md:table-cell">Notes</th>
                    <th className="text-left px-3 py-2.5">Date</th>
                    <th className="text-left px-3 py-2.5">Thread</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                      <td className="px-3 py-3 font-semibold whitespace-nowrap text-lux-text">
                        {lead.name}
                        {lead.deal_closed && (
                          <span className="ml-2 text-[0.65rem] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {lead.profile_url ? (
                          <a href={lead.profile_url} target="_blank" rel="noopener noreferrer" className="text-lux-cyan text-xs font-semibold">
                            View →
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={lead.status as Parameters<typeof Badge>[0]["variant"]}>{lead.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-lux-muted max-w-[140px] truncate hidden md:table-cell" title={lead.notes || ""}>
                        {lead.notes || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-lux-muted/70 whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setModalLead(lead);
                            setModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 bg-lux-blue/15 text-lux-cyan border border-lux-cyan/25 rounded-lg px-2.5 py-1 text-xs font-bold"
                        >
                          💬 Thread
                          {msgCounts[lead.id] > 0 && (
                            <span className="bg-lux-cyan text-lux-bg text-[0.6rem] px-1.5 rounded-full">
                              {msgCounts[lead.id]}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => deleteLead(lead.id)}
                          className="text-red-400 text-xs border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10"
                          aria-label="Delete lead"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {member && modalLead && (
        <LeadModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setModalLead(null);
            load();
          }}
          mode="view"
          memberId={member.id}
          memberName={member.name}
          lead={modalLead}
          onSaved={load}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">{label}</label>
      <input
        type={type}
        className="lux-input mt-1 text-sm py-2.5 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function LeadsWorkspace() {
  return (
    <Suspense>
      <LeadsWorkspaceInner />
    </Suspense>
  );
}
