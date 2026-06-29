"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import LeadModal from "@/components/team/LeadModal";
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
  const supabase = createClient();
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
      supabase.from("leads").select("*").eq("member_id", m.id).order("created_at", { ascending: false }),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
        .gte("created_at", `${today}T00:00:00`),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
        .eq("status", "interested"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
        .eq("status", "replied"),
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("member_id", m.id)
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

    const counts: Record<string, number> = {};
    for (const lead of rows) {
      const { count } = await supabase
        .from("lead_messages")
        .select("*", { count: "exact", head: true })
        .eq("lead_id", lead.id);
      counts[lead.id] = count || 0;
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
        <h1 className="font-bricolage font-extrabold text-2xl text-ink">My Leads</h1>
        <p className="text-[0.8rem] text-mid mt-1">
          Log leads when someone responds — claim links from{" "}
          <Link href="/team/links" className="text-green-700 font-semibold hover:underline">
            Work Links
          </Link>
          .
        </p>
      </div>

      {prefillFromUrl && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-medium">
          Adding lead from outreach link — profile URL is filled in below.
        </div>
      )}

      {stats.closed > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-[#0a150d] to-[#0d2010] border border-amber-500/30 p-5 text-white">
          <div className="flex items-center gap-4">
            <span className="text-4xl">💰</span>
            <div>
              <div className="font-bricolage font-extrabold text-xl">
                {stats.closed} Deal{stats.closed > 1 ? "s" : ""} Closed!
              </div>
              <div className="text-sm text-white/45 mt-0.5">Keep crushing it</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total leads", value: stats.total, accent: "border-t-green-500" },
          { label: "Added today", value: stats.today, accent: "border-t-ind" },
          { label: "Interested", value: stats.interested, accent: "border-t-sky" },
          { label: "Replied", value: stats.replied, accent: "border-t-amber-500" },
          { label: "Deals closed", value: stats.closed, accent: "border-t-amber-400 bg-amber-50/50" },
        ].map((s) => (
          <div key={s.label} className={`card-dark p-4 border-t-[3px] ${s.accent}`}>
            <div className="text-[0.68rem] font-bold uppercase tracking-wide text-dimmer mb-2">
              {s.label}
            </div>
            <div className="font-bricolage font-extrabold text-3xl text-ink">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
        <div className="card-dark p-5 sm:p-6">
          <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-green-600 rounded-sm" />
            Add New Lead
          </h2>
          {formMsg && (
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium mb-4",
                formMsg.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
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
              <label className="text-[0.72rem] font-bold uppercase tracking-wide text-mid">Response status</label>
              <select
                className="input-field mt-1 text-sm"
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
              <label className="text-[0.72rem] font-bold uppercase tracking-wide text-mid">Notes / what they said</label>
              <textarea
                className="input-field mt-1 min-h-[80px] text-sm"
                placeholder="Write what happened, their response…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-ink text-white rounded-xl font-bricolage font-extrabold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add Lead →"}
            </button>
          </form>
        </div>

        <div className="card-dark p-5 sm:p-6 min-w-0">
          <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2 mb-4">
            <span className="w-1 h-5 bg-green-600 rounded-sm" />
            My Lead List ({filtered.length})
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setFilter(s.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full border-[1.5px] text-[0.78rem] font-semibold transition-colors",
                  filter === s.key
                    ? "bg-ink text-white border-ink"
                    : "bg-white text-mid border-line hover:border-ink/30"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-mid">
              <div className="text-4xl mb-3">📋</div>
              <p>No leads yet. Add your first lead from the form!</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="text-[0.68rem] font-bold uppercase tracking-wide text-dimmer bg-off border-b border-line">
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
                    <tr key={lead.id} className="border-b border-line/60 hover:bg-off/80">
                      <td className="px-3 py-3 font-semibold whitespace-nowrap">
                        {lead.name}
                        {lead.deal_closed && (
                          <span className="ml-2 text-[0.65rem] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {lead.profile_url ? (
                          <a href={lead.profile_url} target="_blank" rel="noopener noreferrer" className="text-[#0a66c2] text-xs font-semibold">
                            View →
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={lead.status as Parameters<typeof Badge>[0]["variant"]}>{lead.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-mid max-w-[140px] truncate hidden md:table-cell" title={lead.notes || ""}>
                        {lead.notes || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-dimmer whitespace-nowrap">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setModalLead(lead);
                            setModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 bg-ink2 text-green-400 border border-green-500/25 rounded-lg px-2.5 py-1 text-xs font-bold"
                        >
                          💬 Thread
                          {msgCounts[lead.id] > 0 && (
                            <span className="bg-green-500 text-ink2 text-[0.6rem] px-1.5 rounded-full">
                              {msgCounts[lead.id]}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => deleteLead(lead.id)}
                          className="text-red text-xs border border-red/30 px-2 py-1 rounded-lg hover:bg-red-50"
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
      <label className="text-[0.72rem] font-bold uppercase tracking-wide text-mid">{label}</label>
      <input
        type={type}
        className="input-field mt-1 text-sm py-2.5"
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
