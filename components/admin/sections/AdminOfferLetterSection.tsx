"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import {
  defaultOfferLetterForm,
  OFFER_PRESETS,
  type OfferLetterForm,
  type OfferLetterPreset,
  formatLetterDate,
  formatPkr,
} from "@/lib/offer-letter";
import { offerLetterPreviewHtml } from "@/lib/offer-letter-html";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import type { TeamMember } from "@/lib/types";

const STORAGE_KEY = "inmailly-offer-letter-draft";

export default function AdminOfferLetterSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [form, setForm] = useState<OfferLetterForm>(defaultOfferLetterForm);
  const [preset, setPreset] = useState<OfferLetterPreset>("outreach_worker");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pickMember, setPickMember] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [busy, setBusy] = useState<"pdf" | "send" | "print" | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setForm(JSON.parse(raw) as OfferLetterForm);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers((data.members || []).filter((m: TeamMember) => m.is_active));
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  function applyPreset(p: OfferLetterPreset) {
    setPreset(p);
    const patch = OFFER_PRESETS[p].patch;
    setForm((f) => ({ ...f, ...patch }));
  }

  function fillFromMember(memberId: string) {
    const m = members.find((x) => x.id === memberId);
    if (!m) return;
    setForm((f) => ({
      ...f,
      candidateName: m.name,
      candidateEmail: m.email,
      roleTitle:
        m.role === "team_leader"
          ? "Team Leader"
          : m.role === "senior"
            ? "Senior Outreach Worker"
            : m.role === "admin"
              ? "Team Admin"
              : "Outreach Worker",
    }));
  }

  const previewSrc = useMemo(() => {
    const html = offerLetterPreviewHtml(form);
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }, [form]);

  function patch<K extends keyof OfferLetterForm>(key: K, value: OfferLetterForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function downloadPdf() {
    if (!form.candidateName.trim()) {
      showToast("Enter candidate name first", "error");
      return;
    }
    setBusy("pdf");
    try {
      const res = await fetch(`/api/admin/offer-letter/pdf?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "PDF failed", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `InMailly-Offer-${form.candidateName.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("PDF downloaded");
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail() {
    if (!form.candidateEmail.trim()) {
      showToast("Candidate email required", "error");
      return;
    }
    setBusy("send");
    try {
      const res = await fetch(`/api/admin/offer-letter/send?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ form, emailSubject, emailNote }),
      });
      const data = await res.json();
      if (data.error) showToast(data.error, "error");
      else if (data.skipped) showToast("Email skipped — RESEND_API_KEY not set", "error");
      else showToast(`Offer sent to ${data.sentTo}`);
    } finally {
      setBusy(null);
    }
  }

  function printPreview() {
    setBusy("print");
    const w = window.open(previewSrc, "_blank");
    if (w) {
      w.onload = () => {
        w.print();
        setBusy(null);
      };
    } else {
      showToast("Allow popups to print", "error");
      setBusy(null);
    }
  }

  const presetOptions = (Object.keys(OFFER_PRESETS) as OfferLetterPreset[]).map((k) => ({
    value: k,
    label: OFFER_PRESETS[k].label,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">Offer letters</h1>
        <p className="text-sm text-lux-muted mt-1 max-w-2xl">
          Branded employment offers — set salary (PKR), commission, role, and terms. Preview, download PDF, print, or
          email with attachment.
        </p>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <div className="space-y-4">
          <div className="lux-card-elite p-4 flex flex-wrap gap-2">
            {presetOptions.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => applyPreset(p.value)}
                className={`lux-tab-pill text-xs ${preset === p.value ? "lux-tab-pill-active" : ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {members.length > 0 && (
            <div className="lux-card-elite p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-violet mb-2">
                Fill from team member
              </p>
              <LuxSelect
                value={pickMember}
                onChange={(id) => {
                  setPickMember(id);
                  if (id) fillFromMember(id);
                }}
                options={[
                  { value: "", label: "— Select member —" },
                  ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
                ]}
              />
            </div>
          )}

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Candidate</p>
            <input
              className="lux-input"
              placeholder="Full name"
              value={form.candidateName}
              onChange={(e) => patch("candidateName", e.target.value)}
            />
            <input
              className="lux-input"
              type="email"
              placeholder="Email (required to send)"
              value={form.candidateEmail}
              onChange={(e) => patch("candidateEmail", e.target.value)}
            />
            <input
              className="lux-input"
              placeholder="City / country"
              value={form.candidateCity}
              onChange={(e) => patch("candidateCity", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Role & dates</p>
            <input
              className="lux-input"
              placeholder="Role title"
              value={form.roleTitle}
              onChange={(e) => patch("roleTitle", e.target.value)}
            />
            <input
              className="lux-input"
              placeholder="Department"
              value={form.department}
              onChange={(e) => patch("department", e.target.value)}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[0.62rem] text-lux-muted">Start date</label>
                <input
                  className="lux-input mt-1"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => patch("startDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.62rem] text-lux-muted">Letter date</label>
                <input
                  className="lux-input mt-1"
                  type="date"
                  value={form.letterDate}
                  onChange={(e) => patch("letterDate", e.target.value)}
                />
              </div>
            </div>
            <input
              className="lux-input font-mono text-sm"
              placeholder="Reference no."
              value={form.referenceNo}
              onChange={(e) => patch("referenceNo", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-amber-400">Compensation (PKR)</p>
            <input
              className="lux-input text-lg font-bold"
              type="number"
              min={0}
              placeholder="Monthly salary PKR"
              value={form.monthlySalaryPkr}
              onChange={(e) => patch("monthlySalaryPkr", e.target.value)}
            />
            <p className="text-xs text-lux-cyan font-semibold">{formatPkr(form.monthlySalaryPkr)} / month</p>
            <textarea
              className="lux-input min-h-[80px]"
              placeholder="Commission & bonuses (free text)"
              value={form.commissionText}
              onChange={(e) => patch("commissionText", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-violet">Terms</p>
            <input
              className="lux-input"
              placeholder="Employment type"
              value={form.employmentType}
              onChange={(e) => patch("employmentType", e.target.value)}
            />
            <input
              className="lux-input"
              placeholder="Work location"
              value={form.workLocation}
              onChange={(e) => patch("workLocation", e.target.value)}
            />
            <input
              className="lux-input"
              placeholder="Working hours"
              value={form.workingHours}
              onChange={(e) => patch("workingHours", e.target.value)}
            />
            <input
              className="lux-input"
              type="number"
              min={0}
              placeholder="Probation (months)"
              value={form.probationMonths}
              onChange={(e) => patch("probationMonths", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[72px]"
              placeholder="Custom opening paragraph (optional)"
              value={form.customOpening}
              onChange={(e) => patch("customOpening", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[100px]"
              placeholder="Additional terms (one per line, use • bullets)"
              value={form.additionalTerms}
              onChange={(e) => patch("additionalTerms", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-muted">Signature</p>
            <input
              className="lux-input"
              value={form.signerName}
              onChange={(e) => patch("signerName", e.target.value)}
            />
            <input
              className="lux-input"
              value={form.signerTitle}
              onChange={(e) => patch("signerTitle", e.target.value)}
            />
            <input
              className="lux-input"
              value={form.companyName}
              onChange={(e) => patch("companyName", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3 border-lux-cyan/20">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Email options</p>
            <input
              className="lux-input"
              placeholder="Email subject (optional)"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
            <textarea
              className="lux-input min-h-[60px]"
              placeholder="Short note in email body (optional)"
              value={emailNote}
              onChange={(e) => setEmailNote(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="lux-cyan" onClick={downloadPdf} disabled={!!busy}>
              {busy === "pdf" ? "Generating…" : "Download PDF"}
            </Button>
            <Button variant="lux-soft" onClick={printPreview} disabled={!!busy}>
              {busy === "print" ? "Opening…" : "Print"}
            </Button>
            <Button variant="lux" onClick={sendEmail} disabled={!!busy || !form.candidateEmail}>
              {busy === "send" ? "Sending…" : "Email PDF to candidate"}
            </Button>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 space-y-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-muted">Live preview</p>
          <div className="lux-card-elite p-2 overflow-hidden rounded-xl border border-white/10 bg-slate-900/40">
            <iframe
              title="Offer letter preview"
              src={previewSrc}
              className="w-full bg-white rounded-lg"
              style={{ height: "min(80vh, 900px)" }}
            />
          </div>
          <p className="text-[0.62rem] text-lux-muted text-center">
            Ref {form.referenceNo} · {formatLetterDate(form.letterDate)}
          </p>
        </div>
      </div>
    </div>
  );
}
