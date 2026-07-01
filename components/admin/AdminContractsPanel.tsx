"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { formatLetterDate, formatPkr } from "@/lib/offer-letter";
import { daysBetween } from "@/lib/employment-contract";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import type { OfferLetterForm } from "@/lib/offer-letter";

type ContractRow = {
  id: string;
  reference_no: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  signed_at: string | null;
  form_data: OfferLetterForm;
  termination?: {
    effective_date: string;
    total_days_worked: number;
    pending_amount_pkr: number;
  } | null;
};

export default function AdminContractsPanel() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [terminateId, setTerminateId] = useState("");
  const [termForm, setTermForm] = useState({
    effectiveDate: new Date().toISOString().slice(0, 10),
    totalDaysWorked: "",
    pendingAmountPkr: "",
    reason: "",
    deactivateMember: true,
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/contracts?key=${adminKey}`);
    const data = await res.json();
    setContracts(data.contracts || []);
  }, [adminKey]);

  useEffect(() => {
    load();
    const fn = () => load();
    window.addEventListener("inmailly-contracts-updated", fn);
    return () => window.removeEventListener("inmailly-contracts-updated", fn);
  }, [load]);

  async function downloadPdf(id: string) {
    const res = await fetch(`/api/admin/contracts/${id}/pdf?key=${adminKey}`, {
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
    a.download = "contract.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  function openTerminate(c: ContractRow) {
    const effectiveDate = new Date().toISOString().slice(0, 10);
    setTerminateId(c.id);
    const start = (c.form_data as OfferLetterForm).startDate;
    const days = start ? daysBetween(start, effectiveDate) : 0;
    setTermForm({
      effectiveDate,
      totalDaysWorked: String(days),
      pendingAmountPkr: "",
      reason: "",
      deactivateMember: true,
    });
  }

  async function submitTerminate() {
    if (!terminateId) return;
    setBusy(true);
    const res = await fetch(`/api/admin/contracts/terminate?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        contractId: terminateId,
        effectiveDate: termForm.effectiveDate,
        totalDaysWorked: parseInt(termForm.totalDaysWorked, 10) || 0,
        pendingAmountPkr: parseFloat(termForm.pendingAmountPkr) || 0,
        reason: termForm.reason,
        deactivateMember: termForm.deactivateMember,
      }),
    });
    const data = await res.json();
    if (data.error) showToast(data.error, "error");
    else {
      showToast(data.emailSkipped ? "Terminated (email skipped)" : "Termination sent to employee");
      setTerminateId("");
      load();
    }
    setBusy(false);
  }

  const terminating = contracts.find((c) => c.id === terminateId);

  return (
    <section className="space-y-4 pt-8 border-t border-white/[0.06]">
      <div>
        <h2 className="font-bricolage font-bold text-xl text-lux-text">Contracts & terminations</h2>
        <p className="text-sm text-lux-muted mt-1">
          Offers sent for dashboard signing, signed PDFs, and termination notices with days worked + pending payment.
        </p>
      </div>

      {terminateId && terminating && (
        <div className="lux-card-elite p-5 border-rose-500/30 space-y-3">
          <p className="text-sm font-semibold text-rose-300">
            Terminate: {terminating.candidate_name} ({terminating.reference_no})
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[0.62rem] text-lux-muted">Effective date</label>
              <input
                className="lux-input mt-1"
                type="date"
                value={termForm.effectiveDate}
                onChange={(e) => {
                  const d = e.target.value;
                  const start = (terminating.form_data as OfferLetterForm).startDate;
                  setTermForm((f) => ({
                    ...f,
                    effectiveDate: d,
                    totalDaysWorked: start ? String(daysBetween(start, d)) : f.totalDaysWorked,
                  }));
                }}
              />
            </div>
            <div>
              <label className="text-[0.62rem] text-lux-muted">Total days worked</label>
              <input
                className="lux-input mt-1"
                type="number"
                min={0}
                value={termForm.totalDaysWorked}
                onChange={(e) => setTermForm({ ...termForm, totalDaysWorked: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[0.62rem] text-lux-muted">Pending payment (PKR)</label>
              <input
                className="lux-input mt-1"
                type="number"
                min={0}
                value={termForm.pendingAmountPkr}
                onChange={(e) => setTermForm({ ...termForm, pendingAmountPkr: e.target.value })}
              />
            </div>
          </div>
          <textarea
            className="lux-input min-h-[72px]"
            placeholder="Reason for termination (optional, included in notice)"
            value={termForm.reason}
            onChange={(e) => setTermForm({ ...termForm, reason: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-lux-muted">
            <input
              type="checkbox"
              checked={termForm.deactivateMember}
              onChange={(e) => setTermForm({ ...termForm, deactivateMember: e.target.checked })}
            />
            Deactivate team member account
          </label>
          <div className="flex gap-2">
            <Button variant="lux-soft" size="sm" onClick={() => setTerminateId("")}>
              Cancel
            </Button>
            <Button variant="lux" size="sm" onClick={submitTerminate} disabled={busy}>
              {busy ? "Sending…" : "Send termination notice"}
            </Button>
          </div>
        </div>
      )}

      <div className="lux-card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.06]">
              <th className="text-left px-4 py-3">Candidate</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-lux-muted">
                  No contracts yet — send an offer to dashboard from the form above.
                </td>
              </tr>
            )}
            {contracts.map((c) => {
              const form = c.form_data as OfferLetterForm;
              return (
                <tr key={c.id} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-lux-text">{c.candidate_name}</div>
                    <div className="text-[0.62rem] text-lux-muted">{c.candidate_email}</div>
                    <div className="text-[0.58rem] font-mono text-lux-cyan/80">{c.reference_no}</div>
                  </td>
                  <td className="px-4 py-3 text-lux-muted">{form.roleTitle}</td>
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
                        {c.termination.total_days_worked}d · {formatPkr(c.termination.pending_amount_pkr)} pending
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
                          Terminate
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
