"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
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

export default function LeaderSalesNavInbox({ agentEnabled = false }: { agentEnabled?: boolean }) {
  const [requests, setRequests] = useState<SalesNavLicenseRequest[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const load = useCallback(async () => {
    if (!agentEnabled) {
      setLoading(false);
      return;
    }
    const q = filter === "all" ? "" : `?status=${filter}`;
    const res = await fetch(`/api/team/leader/sales-nav${q}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not load Sales Navigator requests");
      setRequests([]);
      setLoading(false);
      return;
    }
    const list = (data.requests || []) as SalesNavLicenseRequest[];
    setRequests(list);
    setError("");
    setSelectedId((prev) => {
      if (prev && list.some((r) => r.id === prev)) return prev;
      return list[0]?.id || "";
    });
    setLoading(false);
  }, [agentEnabled, filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const selected = requests.find((r) => r.id === selectedId) || requests[0] || null;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (!agentEnabled) {
    return (
      <div className="lux-card-elite p-8 border-amber-500/25 text-center space-y-3">
        <p className="text-lg font-semibold text-amber-200">Sales Navigator — waiting for admin access</p>
        <p className="text-sm text-lux-muted max-w-md mx-auto leading-relaxed">
          Ask admin to grant you Sales Navigator request access. You will only see licenses requested by members on your
          team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bricolage font-bold text-lux-text">Team Sales Navigator requests</h2>
        <p className="text-xs text-lux-muted mt-1">
          Only members assigned to you. Admin still emails activation keys. Sorted by lead volume so you can follow up
          on the highest producers first.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <LuxSelect className="w-48" size="sm" value={filter} onChange={setFilter} options={STATUS_OPTIONS} />
        <Button variant="lux-ghost" size="sm" onClick={load}>
          Refresh
        </Button>
        <span className="text-xs text-lux-muted">{pendingCount} pending</span>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 lux-card overflow-hidden max-h-[520px] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-lux-muted text-sm">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="p-8 text-center text-lux-muted text-sm">No requests from your team in this filter.</p>
          ) : (
            <ul>
              {requests.map((r) => (
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
                      {typeof r.leads_count === "number" ? `${r.leads_count} leads` : ""}
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
                <h3 className="font-bricolage font-bold text-lg text-lux-text">{selected.member_name}</h3>
                <p className="text-sm text-lux-muted mt-1">
                  InMailly: {selected.member_email} · LinkedIn: {selected.linkedin_email}
                </p>
                <p className="text-sm text-amber-200 mt-1">
                  {typeof selected.leads_count === "number" ? `${selected.leads_count} outreach leads` : ""}
                </p>
                <p className="text-xs text-lux-muted mt-1">
                  Requested {new Date(selected.requested_at).toLocaleString()}
                </p>
              </div>
              {selected.status === "error" && selected.member_error_note && (
                <p className="text-sm text-red-200/90">Member note: {selected.member_error_note}</p>
              )}
              {(selected.rerequest_kind || selected.rerequest_reason) && (
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 space-y-2">
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
                </div>
              )}
              <p className="text-xs text-lux-muted">
                Activation keys are sent by admin. Contact admin if this request is waiting too long.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
