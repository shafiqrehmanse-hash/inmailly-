"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import SignaturePad from "@/components/team/SignaturePad";
import {
  buildClientServiceBodyParagraphs,
  formatLetterDate,
  formatUsd,
  type ClientServiceAgreementForm,
} from "@/lib/client-service-agreement";

type Contract = {
  id: string;
  reference_no: string;
  status: string;
  form_data: ClientServiceAgreementForm;
  signed_at: string | null;
  signature_png: string | null;
};

type Termination = {
  effective_date: string;
  inmails_delivered: number;
  inmails_remaining: number;
  refund_amount_usd: number;
  notice_body: string;
  reason: string | null;
};

const SECTION_HEADERS = new Set([
  "Parties",
  "Campaign scope",
  "Investment",
  "Deliverables",
  "Payment terms",
  "Client dashboard & transparency",
  "Confidentiality",
  "Data ownership",
  "Refund & service end",
  "Service terms — important",
  "Additional terms",
  "Electronic acceptance",
]);

export default function ClientContractPage() {
  const [pending, setPending] = useState<Contract | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [termination, setTermination] = useState<Termination | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/client/contract");
    const data = await res.json();
    if (data.pendingOffer) setPending(data.pendingOffer);
    else if (data.contract?.status === "pending_signature") setPending(data.contract);
    else setPending(null);
    setContract(data.contract?.status !== "pending_signature" ? data.contract : null);
    setTermination(data.termination || null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  async function submitSign() {
    if (!pending || !signature || !agreed) {
      flash("Draw signature and agree to terms");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/client/contract/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: pending.id, signaturePng: signature, agreed: true }),
    });
    const data = await res.json();
    if (data.error) flash(data.error);
    else {
      flash("Agreement signed successfully");
      load();
    }
    setBusy(false);
  }

  async function downloadSigned() {
    const res = await fetch("/api/client/contract/pdf");
    if (!res.ok) {
      flash("Could not download");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "InMailly-Signed-Agreement.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadTermination() {
    const res = await fetch("/api/client/contract/termination-pdf");
    if (!res.ok) {
      flash("Could not download");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "InMailly-Service-End-Notice.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  const form = pending?.form_data as ClientServiceAgreementForm | undefined;
  const paragraphs = form ? buildClientServiceBodyParagraphs(form) : [];

  return (
    <div className="space-y-6 max-w-3xl">
      {toast && (
        <div className="lux-toast-anchor" role="status">
          <div className="lux-toast-success text-center">{toast}</div>
        </div>
      )}

      <div>
        <Link href="/client/dashboard" className="text-xs text-lux-cyan hover:underline">
          ← Back to dashboard
        </Link>
        {pending && (
          <div className="mt-4 lux-card-elite p-4 border-red-500/45 bg-red-500/[0.08] flex items-start gap-3">
            <span
              className="admin-alert-dot shrink-0 mt-1.5 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,0.95)]"
              aria-hidden
            />
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-red-400">Signature required</p>
              <p className="text-sm font-bold text-red-300 mt-1 leading-relaxed">
                Read the full service agreement below, confirm your understanding, draw your signature, and submit.
                This defines your InMail package scope and delivery terms.
              </p>
            </div>
          </div>
        )}
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text mt-4">Your service agreement</h1>
        <p className="text-sm text-lux-muted mt-1">
          Review package terms, sign electronically, and keep a copy for your records.
        </p>
      </div>

      {termination && (
        <div className="lux-card-elite p-5 border-rose-500/30 bg-rose-500/[0.06]">
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-rose-400 mb-2">Service ended</p>
          <p className="text-sm text-lux-text whitespace-pre-line">{termination.notice_body}</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
            <div className="rounded-lg border border-white/10 p-3">
              <span className="text-lux-muted text-xs">InMails delivered</span>
              <p className="font-bold text-lux-text tabular-nums">
                {termination.inmails_delivered.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <span className="text-lux-muted text-xs">Remaining quota</span>
              <p className="font-bold text-lux-text tabular-nums">
                {termination.inmails_remaining.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 p-3">
              <span className="text-lux-muted text-xs">Refund (if any)</span>
              <p className="font-bold text-amber-400 tabular-nums">{formatUsd(termination.refund_amount_usd)}</p>
            </div>
          </div>
          <Button variant="lux-soft" size="sm" className="mt-4" onClick={downloadTermination}>
            Download service end notice (PDF)
          </Button>
        </div>
      )}

      {contract?.status === "signed" && !pending && (
        <div className="lux-card-elite p-5 border-emerald-500/25">
          <p className="text-emerald-400 font-semibold text-sm mb-1">✓ Agreement signed</p>
          <p className="text-xs text-lux-muted">
            Ref {contract.reference_no}
            {contract.signed_at && ` · ${formatLetterDate(contract.signed_at.slice(0, 10))}`}
          </p>
          <Button variant="lux-cyan" size="sm" className="mt-3" onClick={downloadSigned}>
            Download signed agreement (PDF)
          </Button>
        </div>
      )}

      {pending && form && (
        <>
          <div className="lux-card-elite p-5 sm:p-6 space-y-3 max-h-[50vh] overflow-y-auto lux-scrollbar-hide text-sm text-lux-muted leading-relaxed">
            <p className="text-[0.62rem] font-extrabold uppercase tracking-widest text-red-400 sticky top-0 bg-inherit py-1 flex items-center gap-2">
              <span
                className="admin-alert-dot w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]"
                aria-hidden
              />
              Read before signing — ref {pending.reference_no}
            </p>
            {paragraphs.map((para, i) => {
              if (!para) return <div key={i} className="h-2" />;
              const isLegal =
                para === "Service terms — important" ||
                para === "Electronic acceptance" ||
                (para.startsWith("•") &&
                  (paragraphs.slice(0, i).includes("Service terms — important") ||
                    paragraphs.slice(0, i).includes("Electronic acceptance")));
              if (SECTION_HEADERS.has(para)) {
                return (
                  <p
                    key={i}
                    className={`text-xs font-bold uppercase tracking-wide ${
                      para.includes("important") || para === "Electronic acceptance"
                        ? "text-red-400 font-extrabold"
                        : "text-lux-violet"
                    }`}
                  >
                    {para}
                  </p>
                );
              }
              if (para.startsWith("Dear ")) {
                return (
                  <p key={i} className="text-lux-text font-semibold">
                    {para}
                  </p>
                );
              }
              if (isLegal) {
                return (
                  <p key={i} className="text-sm font-bold text-red-400/95 leading-relaxed">
                    {para}
                  </p>
                );
              }
              return <p key={i}>{para}</p>;
            })}
          </div>

          <div className="lux-card-elite p-5 border-red-500/40 bg-red-500/[0.06]">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 accent-red-500"
              />
              <span className="text-sm font-bold text-red-400 leading-relaxed">
                I confirm I have authority to sign on behalf of my organization. I understand the package scope,
                payment terms, refund policy, and that outreach results are not guaranteed. I agree to sign
                electronically.
              </span>
            </label>
          </div>

          <div className="lux-card-elite p-5 space-y-3 border-red-500/25">
            <p className="text-[0.62rem] font-extrabold uppercase tracking-widest text-red-400 flex items-center gap-2">
              <span
                className="admin-alert-dot w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]"
                aria-hidden
              />
              Your signature — required
            </p>
            <SignaturePad onChange={setSignature} />
            <Button
              variant="lux-cyan"
              className="w-full !bg-red-600 hover:!bg-red-500 !border-red-500/50 font-bold"
              onClick={submitSign}
              disabled={busy || !agreed || !signature}
            >
              {busy ? "Submitting…" : "Sign & submit agreement"}
            </Button>
          </div>
        </>
      )}

      {!pending && !contract && !termination && (
        <div className="lux-card-elite p-8 text-center text-lux-muted text-sm">
          No service agreement on file for your account yet.
        </div>
      )}
    </div>
  );
}
