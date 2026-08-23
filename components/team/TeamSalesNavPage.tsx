"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { SalesNavLicenseRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Waiting for admin", className: "text-amber-300 bg-amber-500/15 border-amber-500/30" },
  activation_sent: { label: "Ready — activate now", className: "text-lux-cyan bg-lux-cyan/10 border-lux-cyan/30" },
  activated: { label: "Activated", className: "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" },
  error: { label: "Error reported", className: "text-red-300 bg-red-500/15 border-red-500/30" },
};

export default function TeamSalesNavPage() {
  const [request, setRequest] = useState<SalesNavLicenseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [linkedinEmail, setLinkedinEmail] = useState("");
  const [errorNote, setErrorNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/sales-nav");
    const data = await res.json();
    if (res.ok) setRequest(data.request || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function submitRequest() {
    setErrorMsg("");
    setBusy(true);
    const res = await fetch("/api/team/sales-nav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkedinEmail }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setErrorMsg(data.error);
      return;
    }
    setRequest(data.request);
    setModalOpen(false);
    setLinkedinEmail("");
    showToast("Request sent — admin will email you when ready");
  }

  async function markResolved(action: "activated" | "error") {
    setErrorMsg("");
    setBusy(true);
    const res = await fetch("/api/team/sales-nav", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, errorNote: action === "error" ? errorNote : undefined }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setErrorMsg(data.error);
      return;
    }
    setRequest(data.request);
    setErrorNote("");
    showToast(action === "activated" ? "Marked as activated — thank you!" : "Error reported — admin notified");
  }

  const openRequest = request && (request.status === "pending" || request.status === "activation_sent");
  const canRequestNew = !openRequest && request?.status !== "activated";

  const statusStyle = request ? STATUS_LABEL[request.status] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 rounded-lg bg-lux-cyan/20 border border-lux-cyan/40 text-sm text-lux-cyan font-semibold shadow-lg">
          {toast}
        </div>
      )}

      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lux-violet/80 mb-2">
          LinkedIn Sales Navigator
        </p>
        <h1 className="font-bricolage font-extrabold text-[clamp(1.5rem,4vw,2rem)] tracking-tight text-lux-text">
          Sales Navigator license
        </h1>
        <p className="text-sm text-lux-muted mt-2 leading-relaxed">
          Need a Sales Navigator seat? Request one here. Admin activates your license and emails you the activation key or link.
        </p>
      </div>

      <div className="lux-card-elite p-5 border-lux-cyan/20 bg-gradient-to-br from-lux-cyan/[0.06] via-transparent to-lux-violet/[0.05]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-bricolage font-bold text-lg text-lux-text">Request a license</h2>
            <p className="text-sm text-lux-muted mt-1">
              Use the same email you use to log in to LinkedIn. Admin gets notified instantly.
            </p>
          </div>
          {!loading && canRequestNew && (
            <Button variant="lux" onClick={() => setModalOpen(true)}>
              Request Sales Navigator
            </Button>
          )}
          {!loading && request?.status === "activated" && (
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
              ✓ Active on file
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-lux-muted text-sm">Loading…</p>
      ) : request ? (
        <div className="lux-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bricolage font-bold text-lux-text">Your request</h3>
            {statusStyle && (
              <span
                className={cn(
                  "text-[0.62rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                  statusStyle.className
                )}
              >
                {statusStyle.label}
              </span>
            )}
          </div>

          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wide text-lux-muted">LinkedIn email</dt>
              <dd className="text-lux-text font-medium mt-0.5">{request.linkedin_email}</dd>
            </div>
            <div>
              <dt className="text-[0.65rem] uppercase tracking-wide text-lux-muted">Requested</dt>
              <dd className="text-lux-text mt-0.5">{new Date(request.requested_at).toLocaleString()}</dd>
            </div>
          </dl>

          {request.status === "pending" && (
            <p className="text-sm text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
              Admin is preparing your license. You will receive an email when the activation key is ready.
            </p>
          )}

          {request.status === "activation_sent" && request.activation_key && (
            <div className="space-y-4">
              <div className="rounded-xl border border-lux-cyan/30 bg-black/30 p-4">
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan mb-2">
                  Activation key / link
                </p>
                <pre className="text-sm text-lux-text whitespace-pre-wrap break-all font-mono leading-relaxed">
                  {request.activation_key}
                </pre>
              </div>
              <div className="text-sm text-lux-muted space-y-1">
                <p>
                  <strong className="text-lux-text">1.</strong> Open <strong className="text-lux-cyan">Google Chrome</strong> on a{" "}
                  <strong className="text-lux-text">desktop or laptop</strong> (not phone).
                </p>
                <p>
                  <strong className="text-lux-text">2.</strong> Sign in to LinkedIn with <strong className="text-lux-text">{request.linkedin_email}</strong> and complete activation.
                </p>
                <p>
                  <strong className="text-lux-text">3.</strong> Come back here and confirm below.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="lux" disabled={busy} onClick={() => markResolved("activated")}>
                  ✓ Mark as activated
                </Button>
                <Button variant="lux-ghost" disabled={busy} onClick={() => markResolved("error")}>
                  Report activation error
                </Button>
              </div>
              <textarea
                className="lux-input w-full min-h-[80px] text-sm"
                placeholder="Optional: describe the error (screenshot message, login issue, etc.)"
                value={errorNote}
                onChange={(e) => setErrorNote(e.target.value)}
              />
            </div>
          )}

          {request.status === "error" && (
            <div className="space-y-3">
              <p className="text-sm text-red-200/90">
                Admin was notified. They will send a new activation when fixed.
                {request.member_error_note ? ` Your note: “${request.member_error_note}”` : ""}
              </p>
              <Button variant="lux" onClick={() => setModalOpen(true)}>
                Request again
              </Button>
            </div>
          )}

          {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
        </div>
      ) : (
        <p className="text-sm text-lux-muted">No requests yet. Click the button above to get started.</p>
      )}

      <Modal open={modalOpen} onClose={() => !busy && setModalOpen(false)} title="Request Sales Navigator">
        <p className="text-sm text-lux-muted mb-4">
          Enter the email address registered on your LinkedIn account. Admin uses this to assign your Sales Navigator seat.
        </p>
        <label className="block text-[0.65rem] font-semibold uppercase tracking-wide text-lux-muted mb-1.5">
          LinkedIn email
        </label>
        <input
          className="lux-input w-full mb-4"
          type="email"
          placeholder="you@email.com"
          value={linkedinEmail}
          onChange={(e) => setLinkedinEmail(e.target.value)}
          autoFocus
        />
        {errorMsg && <p className="text-sm text-red-400 mb-3">{errorMsg}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="lux-ghost" onClick={() => setModalOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="lux" onClick={submitRequest} disabled={busy || !linkedinEmail.includes("@")}>
            {busy ? "Sending…" : "Submit request"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
