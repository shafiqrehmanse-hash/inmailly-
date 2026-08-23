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

export default function AdminSalesNavSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };

  const [requests, setRequests] = useState<SalesNavLicenseRequest[]>([]);
  const [filter, setFilter] = useState("pending");
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

  useEffect(() => {
    load();
  }, [load]);

  const selected = requests.find((r) => r.id === selectedId) || requests[0] || null;

  useEffect(() => {
    if (requests.length && !selectedId) setSelectedId(requests[0].id);
  }, [requests, selectedId]);

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

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const errorCount = requests.filter((r) => r.status === "error").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Sales Navigator licenses</h1>
        <p className="text-sm text-lux-muted mt-1">
          Team members request licenses from their workspace. Paste the activation key or link and email it to them.
        </p>
      </div>

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
        <Button variant="lux-ghost" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 lux-card overflow-hidden max-h-[520px] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-lux-muted text-sm">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="p-8 text-center text-lux-muted text-sm">No requests in this filter.</p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
