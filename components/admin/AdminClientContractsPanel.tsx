"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { formatLetterDate, formatUsd, formatInmailCount } from "@/lib/client-service-agreement";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import type { ClientServiceAgreementForm } from "@/lib/client-service-agreement";

type ContractRow = {
  id: string;
  reference_no: string;
  contact_name: string;
  contact_email: string;
  status: string;
  signed_at: string | null;
  form_data: ClientServiceAgreementForm;
  termination?: {
    effective_date: string;
    inmails_delivered: number;
    inmails_remaining: number;
    refund_amount_usd: number;
  } | null;
};

export default function AdminClientContractsPanel() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [terminateId, setTerminateId] = useState("");
  const [termForm, setTermForm] = useState({
    effectiveDate: new Date().toISOString().slice(0, 10),
    inmailsDelivered: "",
    inmailsRemaining: "",
    refundAmountUsd: "",
    reason: "",
    pauseProject: true,
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/client-contracts?key=${adminKey}`);
    const data = await res.json();
    setContracts(data.contracts || []);
  }, [adminKey]);

  useEffect(() => {
    load();
    const fn = () => load();
    window.addEventListener("inmailly-client-contracts-updated", fn);
    return () => window.removeEventListener("inmailly-client-contracts-updated", fn);
  }, [load]);

  async function downloadPdf(id: string) {
    const res = await fetch(`/api/admin/client-contracts/${id}/pdf?key=${adminKey}`, {
      headers: { "x-admin-key": adminKey },
    });
    if (!res.ok) {
      showToast("Download failed", "error");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client-agreement.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openTerminate(c: ContractRow) {
    const form = c.form_data as ClientServiceAgreementForm;
    const total = parseInt(form.inmailPackageSize.replace(/\D/g, ""), 10) || 0;
    setTerminateId(c.id);
    setTermForm({
      effectiveDate: new Date().toISOString().slice(0, 10),
      inmailsDelivered: "0",
      inmailsRemaining: String(total),
      refundAmountUsd: "",
      reason: "",
      pauseProject: true,
    });
  }

  async function submitTerminate() {
    if (!terminateId) return;
    setBusy(true);
    const res = await fetch(`/api/admin/client-contracts/terminate?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        contractId: terminateId,
        effectiveDate: termForm.effectiveDate,
        inmailsDelivered: parseInt(termForm.inmailsDelivered, 10) || 0,
        inmailsRemaining: parseInt(termForm.inmailsRemaining, 10) || 0,
        refundAmountUsd: parseFloat(termForm.refundAmountUsd) || 0,
        reason: termForm.reason,
        pauseProject: termForm.pauseProject,
      }),
    });
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    else {
      showToast(data.emailSkipped ? "Service ended (email skipped)" : "Service end notice sent to client");
      setTerminateId("");
      load();
    }
    setBusy(false);
  }

  const terminating = contracts.find((c) => c.id === terminateId);

  return (
    <section className="space-y-4 pt-8 border-t border-white/[0.06]">
      <div>
        <h2 className="font-bricolage font-bold text-xl text-lux-text">Client agreements & service end</h2>
        <p className="text-sm text-lux-muted mt-1">
          Agreements sent for portal signing, signed PDFs, and service end notices with delivery summary + refund.
        </p>
      </div>

      {terminateId && terminating && (
        <div className="lux-card-elite p-5 border-rose-500/30 space-y-3">
          <p className="text-sm font-semibold text-rose-300">
            End service: {terminating.contact_name} ({terminating.reference_no})
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[0.62rem] text-lux-muted">Effective date</label>
              <input
                className="lux-input mt-1"
                type="date"
                value={termForm.effectiveDate}
                onChange={(e) => setTermForm({ ...termForm, effectiveDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[0.62rem] text-lux-muted">InMails delivered</label>
              <input
                className="lux-input mt-1"
                type="number"
                min={0}
                value={termForm.inmailsDelivered}
                onChange={(e) => {
                  const delivered = parseInt(e.target.value, 10) || 0;
                  const form = terminating.form_data as ClientServiceAgreementForm;
                  const total = parseInt(form.inmailPackageSize.replace(/\D/g, ""), 10) || 0;
                  setTermForm({
                    ...termForm,
                    inmailsDelivered: e.target.value,
                    inmailsRemaining: String(Math.max(0, total - delivered)),
                  });
                }}
              />
            </div>
            <div>
              <label className="text-[0.62rem] text-lux-muted">InMails remaining</label>
              <input
                className="lux-input mt-1"
                type="number"
                min={0}
                value={termForm.inmailsRemaining}
                onChange={(e) => setTermForm({ ...termForm, inmailsRemaining: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[0.62rem] text-lux-muted">Refund amount (USD)</label>
              <input
                className="lux-input mt-1"
                type="number"
                min={0}
                step="0.01"
                value={termForm.refundAmountUsd}
                onChange={(e) => setTermForm({ ...termForm, refundAmountUsd: e.target.value })}
              />
            </div>
          </div>
          <textarea
            className="lux-input min-h-[72px]"
            placeholder="Reason for service end (optional)"
            value={termForm.reason}
            onChange={(e) => setTermForm({ ...termForm, reason: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-lux-muted">
            <input
              type="checkbox"
              checked={termForm.pauseProject}
              onChange={(e) => setTermForm({ ...termForm, pauseProject: e.target.checked })}
            />
            Pause linked campaign project
          </label>
          <div className="flex gap-2">
            <Button variant="lux-soft" size="sm" onClick={() => setTerminateId("")}>
              Cancel
            </Button>
            <Button variant="lux" size="sm" onClick={submitTerminate} disabled={busy}>
              {busy ? "Sending…" : "Send service end notice"}
            </Button>
          </div>
        </div>
      )}

      <div className="lux-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.06]">
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3">Package</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-lux-muted">
                  No client agreements yet — send one from the form above.
                </td>
              </tr>
            )}
            {contracts.map((c) => {
              const form = c.form_data as ClientServiceAgreementForm;
              return (
                <tr key={c.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-lux-text">{c.contact_name}</div>
                    <div className="text-[0.62rem] text-lux-muted">{form.clientCompany || c.contact_email}</div>
                    <div className="text-[0.58rem] font-mono text-lux-cyan/80">{c.reference_no}</div>
                  </td>
                  <td className="px-4 py-3 text-lux-muted">
                    {form.packageName} · {formatInmailCount(form.inmailPackageSize)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[0.62rem] font-bold uppercase ${
                        c.status === "signed"
                          ? "text-emerald-400"
                          : c.status === "terminated"
                            ? "text-rose-400"
                            : "text-amber-400"
                      }`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                    {c.signed_at && (
                      <div className="text-[0.58rem] text-lux-muted">
                        {formatLetterDate(c.signed_at.slice(0, 10))}
                      </div>
                    )}
                    {c.termination && (
                      <div className="text-[0.58rem] text-lux-muted mt-1">
                        {c.termination.inmails_delivered.toLocaleString()} sent ·{" "}
                        {formatUsd(c.termination.refund_amount_usd)} refund
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {(c.status === "signed" || c.status === "terminated") && (
                        <button
                          type="button"
                          onClick={() => downloadPdf(c.id)}
                          className="text-[0.62rem] px-2 py-1 rounded-lg border border-lux-cyan/30 text-lux-cyan"
                        >
                          PDF
                        </button>
                      )}
                      {c.status === "signed" && (
                        <button
                          type="button"
                          onClick={() => openTerminate(c)}
                          className="text-[0.62rem] px-2 py-1 rounded-lg border border-rose-500/30 text-rose-300"
                        >
                          End service
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
