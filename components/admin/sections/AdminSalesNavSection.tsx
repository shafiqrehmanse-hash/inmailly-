"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import type { SalesNavLicenseRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "activation_sent", label: "Activation sent" },
  { value: "activated", label: "Activated" },
  { value: "error", label: "Error reported" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "text-amber-300 bg-amber-500/15 border-amber-500/30",
  activation_sent: "text-lux-cyan bg-lux-cyan/10 border-lux-cyan/30",
  activated: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30",
  error: "text-red-300 bg-red-500/15 border-red-500/30",
};

type NavLeader = {
  id: string;
  name: string;
  email: string;
  sales_nav_agent: boolean;
  is_active: boolean;
};

export default function AdminSalesNavSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };

  const [requests, setRequests] = useState<SalesNavLicenseRequest[]>([]);
  const [leaders, setLeaders] = useState<NavLeader[]>([]);
  const [filter, setFilter] = useState("pending");
  const [leaderFilter, setLeaderFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [activationKey, setActivationKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendingAlert, setResendingAlert] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const q = filter === "all" ? "" : `&status=${filter}`;
    const res = await fetch(`/api/admin/sales-nav?key=${adminKey}${q}`);
    const data = await res.json();
    if (res.ok) {
      setRequests(data.requests || []);
      setNotifyEmail(data.notifyEmail || "");
    }
    setLoading(false);
  }, [adminKey, filter]);

  const loadLeaders = useCallback(async () => {
    const res = await fetch(`/api/admin/sales-nav/agents?key=${adminKey}`);
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    setLeaders(data.leaders || []);
  }, [adminKey, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadLeaders();
  }, [loadLeaders]);

  const visibleRequests =
    leaderFilter === "all"
      ? requests
      : leaderFilter === "unassigned"
        ? requests.filter((r) => !r.leader_id)
        : requests.filter((r) => r.leader_id === leaderFilter);

  const selected = visibleRequests.find((r) => r.id === selectedId) || visibleRequests[0] || null;

  useEffect(() => {
    const list =
      leaderFilter === "all"
        ? requests
        : leaderFilter === "unassigned"
          ? requests.filter((r) => !r.leader_id)
          : requests.filter((r) => r.leader_id === leaderFilter);
    if (list.length && !list.some((r) => r.id === selectedId)) {
      setSelectedId(list[0].id);
    }
  }, [requests, leaderFilter, selectedId]);

  async function sendActivation() {
    if (!selected) return;
    if (!activationKey.trim()) {
      showToast("Paste the activation key or link first", "error");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/sales-nav?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ requestId: selected.id, activationKey: activationKey.trim() }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      showToast(data.error, "error");
      return;
    }
    showToast(`Activation emailed to ${data.sentTo || selected.member_email}`);
    setActivationKey("");
    load();
  }

  async function resendAdminAlert() {
    if (!selected) return;
    setResendingAlert(true);
    const res = await fetch(`/api/admin/sales-nav?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ requestId: selected.id }),
    });
    const data = await res.json();
    setResendingAlert(false);
    if (data.error) showToast(data.error, "error");
    else showToast(`Admin alert sent to ${data.sentTo || notifyEmail}`);
  }

  const pendingCount = visibleRequests.filter((r) => r.status === "pending").length;
  const errorCount = visibleRequests.filter((r) => r.status === "error").length;

  async function toggleSalesNavAgent(leaderId: string, enabled: boolean) {
    const res = await fetch(`/api/admin/sales-nav/agents?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ leaderId, salesNavAgent: enabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Could not update access", "error");
      return;
    }
    showToast(enabled ? "Sales Nav access granted" : "Sales Nav access revoked");
    loadLeaders();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Sales Navigator licenses</h1>
        <p className="text-sm text-lux-muted mt-1">
          Team members request licenses from their workspace. Paste the activation key or link and email it to them.
          Grant a team leader access so they only see requests from <strong className="text-lux-text">their</strong>{" "}
          assigned members.
        </p>
      </div>

      <section className="lux-card-elite p-4 border-amber-500/20 space-y-3">
        <h2 className="text-sm font-semibold text-lux-text">Team leader access</h2>
        <p className="text-xs text-lux-muted">
          Checked leaders get a Sales Nav tab in Leader workspace. They cannot see other leaders&apos; people.
        </p>
        <div className="space-y-2">
          {leaders.length === 0 && <p className="text-sm text-lux-muted">No team leaders found.</p>}
          {leaders.map((l) => (
            <label
              key={l.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                l.sales_nav_agent ? "border-amber-500/30 bg-amber-500/5" : "border-white/[0.06] hover:bg-white/[0.02]"
              )}
            >
              <input
                type="checkbox"
                checked={Boolean(l.sales_nav_agent)}
                disabled={!l.is_active}
                onChange={(e) => toggleSalesNavAgent(l.id, e.target.checked)}
                className="accent-amber-400"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-lux-text">{l.name}</div>
                <div className="text-xs text-lux-muted truncate">{l.email}</div>
              </div>
              {!l.is_active && <span className="text-[0.58rem] uppercase text-red-300">Inactive</span>}
            </label>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lux-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-300 tabular-nums">{pendingCount}</div>
          <div className="text-xs text-lux-muted mt-1 uppercase tracking-wide">Pending</div>
        </div>
        <div className="lux-card p-4 text-center">
          <div className="text-2xl font-bold text-red-300 tabular-nums">{errorCount}</div>
          <div className="text-xs text-lux-muted mt-1 uppercase tracking-wide">Errors</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <LuxSelect className="w-48" size="sm" value={filter} onChange={setFilter} options={STATUS_OPTIONS} />
        <LuxSelect
          className="w-56"
          size="sm"
          value={leaderFilter}
          onChange={setLeaderFilter}
          options={[
            { value: "all", label: "All team leaders" },
            { value: "unassigned", label: "No team leader" },
            ...leaders.map((l) => ({ value: l.id, label: l.name })),
          ]}
        />
        <Button variant="lux-ghost" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 lux-card overflow-hidden max-h-[520px] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-lux-muted text-sm">Loading…</p>
          ) : visibleRequests.length === 0 ? (
            <p className="p-8 text-center text-lux-muted text-sm">No requests in this filter.</p>
          ) : (
            <ul>
              {visibleRequests.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors",
                      selected?.id === r.id && "bg-lux-cyan/10 border-l-2 border-l-lux-cyan"
                    )}
                  >
                    <div className="font-medium text-lux-text">{r.member_name}</div>
                    <div className="text-xs text-lux-muted truncate">{r.linkedin_email}</div>
                    <div className="text-[0.62rem] text-amber-200/90 mt-1">
                      {r.leader_name ? `Leader: ${r.leader_name}` : "No team leader"}
                      {typeof r.leads_count === "number" ? ` · ${r.leads_count} leads` : ""}
                    </div>
                    <span
                      className={cn(
                        "inline-block mt-1.5 text-[0.58rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                        STATUS_BADGE[r.status]
                      )}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 lux-card p-5 space-y-4">
          {!selected ? (
            <p className="text-lux-muted text-sm">Select a request</p>
          ) : (
            <>
              <div>
                <h2 className="font-bricolage font-bold text-lg text-lux-text">{selected.member_name}</h2>
                <p className="text-sm text-lux-muted mt-1">
                  InMailly: {selected.member_email} · LinkedIn: {selected.linkedin_email}
                </p>
                <p className="text-sm text-amber-200 mt-1">
                  Team leader: {selected.leader_name || "Unassigned"}
                  {typeof selected.leads_count === "number" ? ` · ${selected.leads_count} outreach leads` : ""}
                </p>
                <p className="text-xs text-lux-muted mt-1">
                  Requested {new Date(selected.requested_at).toLocaleString()}
                </p>
                {selected.status === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="lux-ghost"
                      size="sm"
                      disabled={resendingAlert}
                      onClick={resendAdminAlert}
                    >
                      {resendingAlert ? "Sending…" : `Resend admin alert${notifyEmail ? ` → ${notifyEmail}` : ""}`}
                    </Button>
                  </div>
                )}
              </div>

              {(selected.status === "pending" || selected.status === "error") && (
                <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                  <p className="text-sm font-semibold text-lux-text">Send activation to member</p>
                  <p className="text-xs text-lux-muted">
                    Paste the full activation key, code, or LinkedIn activation URL. It is emailed to{" "}
                    <strong className="text-lux-cyan">{selected.member_email}</strong> with Chrome desktop instructions.
                  </p>
                  <textarea
                    className="lux-input w-full min-h-[140px] font-mono text-sm"
                    placeholder="Paste activation key or https://… link here"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                  />
                  <Button
                    variant="lux"
                    className="w-full sm:w-auto"
                    disabled={busy}
                    onClick={sendActivation}
                  >
                    {busy ? "Sending…" : "Email activation to member"}
                  </Button>
                </div>
              )}

              {selected.status === "activation_sent" && selected.activation_key && (
                <div className="rounded-lg border border-lux-cyan/25 bg-black/25 p-3">
                  <p className="text-[0.62rem] uppercase tracking-wide text-lux-muted mb-1">Sent activation</p>
                  <pre className="text-xs text-lux-text whitespace-pre-wrap break-all font-mono">
                    {selected.activation_key}
                  </pre>
                  <p className="text-xs text-lux-muted mt-2">Waiting for member to mark activated or report error.</p>
                </div>
              )}

              {selected.status === "activated" && (
                <p className="text-sm text-emerald-300">Member confirmed activation.</p>
              )}

                {selected.status === "error" && selected.member_error_note && (
                <p className="text-sm text-red-200/90">
                  Member note: {selected.member_error_note}
                </p>
              )}

              {(selected.rerequest_kind || selected.rerequest_reason || selected.screenshot_url) && (
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-200">Request again details</p>
                  {selected.rerequest_kind && (
                    <p className="text-sm text-lux-text">
                      {selected.rerequest_kind === "credits_completed"
                        ? "Credits completed"
                        : "Error — needs a new license"}
                    </p>
                  )}
                  {selected.rerequest_reason && (
                    <p className="text-sm text-lux-muted whitespace-pre-wrap">{selected.rerequest_reason}</p>
                  )}
                  {selected.screenshot_url && (
                    <a href={selected.screenshot_url} target="_blank" rel="noopener noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selected.screenshot_url}
                        alt="Error screenshot"
                        className="max-h-56 rounded-lg border border-white/10"
                      />
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
