"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import SalesNavLeaderReviewTag from "@/components/team/SalesNavLeaderReviewTag";
import type { SalesNavLeaderReview, SalesNavLicenseRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "activation_sent", label: "Activation sent" },
  { value: "activated", label: "Activated" },
  { value: "error", label: "Error reported" },
];

const REVIEW_OPTIONS = [
  { value: "all", label: "All leader reviews" },
  { value: "pending", label: "Awaiting my review" },
  { value: "approved", label: "Approved" },
  { value: "not_eligible", label: "Not eligible" },
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
  const [reviewFilter, setReviewFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);

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

  const visible =
    reviewFilter === "all"
      ? requests
      : requests.filter((r) => (r.leader_review || "pending") === reviewFilter);

  const selected = visible.find((r) => r.id === selectedId) || visible[0] || null;
  const canReview = selected && (selected.status === "pending" || selected.status === "error");

  async function setReview(review: SalesNavLeaderReview) {
    if (!selected) return;
    setBusy(true);
    const res = await fetch("/api/team/leader/sales-nav", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: selected.id, review }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not save review");
      return;
    }
    setError("");
    load();
  }

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
          Approve people you want licensed (green for admin). Cross out anyone who is not eligible — they show as
          cancelled on the admin board. Activation keys are still sent by admin.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <LuxSelect className="w-48" size="sm" value={filter} onChange={setFilter} options={STATUS_OPTIONS} />
        <LuxSelect className="w-52" size="sm" value={reviewFilter} onChange={setReviewFilter} options={REVIEW_OPTIONS} />
        <Button variant="lux-ghost" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 lux-card overflow-hidden max-h-[520px] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-lux-muted text-sm">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="p-8 text-center text-lux-muted text-sm">No requests from your team in this filter.</p>
          ) : (
            <ul>
              {visible.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors",
                      selected?.id === r.id && "bg-lux-cyan/10 border-l-2 border-l-lux-cyan",
                      r.leader_review === "not_eligible" && "opacity-70"
                    )}
                  >
                    <div
                      className={cn(
                        "font-medium text-lux-text",
                        r.leader_review === "not_eligible" && "line-through text-lux-muted"
                      )}
                    >
                      {r.member_name}
                    </div>
                    <div className="text-xs text-lux-muted truncate">{r.linkedin_email}</div>
                    <div className="text-[0.62rem] text-amber-200/90 mt-1">
                      {typeof r.leads_count === "number" ? `${r.leads_count} leads` : ""}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span
                        className={cn(
                          "inline-block text-[0.58rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                          STATUS_BADGE[r.status]
                        )}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                      <SalesNavLeaderReviewTag review={r.leader_review} />
                    </div>
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
                <h3
                  className={cn(
                    "font-bricolage font-bold text-lg text-lux-text",
                    selected.leader_review === "not_eligible" && "line-through text-lux-muted"
                  )}
                >
                  {selected.member_name}
                </h3>
                <p className="text-sm text-lux-muted mt-1">
                  InMailly: {selected.member_email} · LinkedIn: {selected.linkedin_email}
                </p>
                <p className="text-sm text-amber-200 mt-1">
                  {typeof selected.leads_count === "number" ? `${selected.leads_count} outreach leads` : ""}
                </p>
                <p className="text-xs text-lux-muted mt-1">
                  Requested {new Date(selected.requested_at).toLocaleString()}
                </p>
                <div className="mt-2">
                  <SalesNavLeaderReviewTag review={selected.leader_review} />
                </div>
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
              {canReview && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                  <Button
                    variant="lux"
                    disabled={busy || selected.leader_review === "approved"}
                    onClick={() => setReview("approved")}
                  >
                    Approve for license
                  </Button>
                  <Button
                    variant="lux-ghost"
                    disabled={busy || selected.leader_review === "not_eligible"}
                    onClick={() => setReview("not_eligible")}
                  >
                    Cross out — not eligible
                  </Button>
                  {selected.leader_review && selected.leader_review !== "pending" && (
                    <Button variant="lux-ghost" disabled={busy} onClick={() => setReview("pending")}>
                      Undo review
                    </Button>
                  )}
                </div>
              )}
              <p className="text-xs text-lux-muted">
                Approved requests get a green tag on the admin board. Crossed names show as not eligible / cancelled.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
