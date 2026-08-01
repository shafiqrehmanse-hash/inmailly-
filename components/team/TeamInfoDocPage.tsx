"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import type { InfoDocForm, InfoDocStats } from "@/lib/info-doc";
import { defaultInfoDocForm } from "@/lib/info-doc";

type PendingDoc = {
  id: string;
  reference_no: string;
  admin_note: string | null;
  status: string;
};

type SubmittedDoc = PendingDoc & {
  submitted_at: string | null;
  stats_snapshot: InfoDocStats | null;
  form_data: InfoDocForm;
};

function FileUploadField({
  label,
  kind,
  docId,
  uploaded,
  onUploaded,
  optional,
}: {
  label: string;
  kind: "govt_id_front" | "govt_id_back" | "experience_letter";
  docId: string;
  uploaded: boolean;
  onUploaded: (field: keyof InfoDocForm, path: string) => void;
  optional?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docId", docId);
    fd.append("kind", kind);
    const res = await fetch("/api/team/info-doc/upload", { method: "POST", body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    onUploaded(data.fieldKey as keyof InfoDocForm, data.path);
    e.target.value = "";
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-lux-muted">
        {label}
        {optional ? " (optional)" : " *"}
      </label>
      <input
        type="file"
        accept={kind === "experience_letter" ? "image/*,application/pdf" : "image/*"}
        disabled={busy}
        onChange={onChange}
        className="block w-full text-sm text-lux-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-lux-cyan/15 file:text-lux-cyan file:font-semibold file:text-xs"
      />
      {uploaded && <p className="text-xs text-emerald-400 font-semibold">Uploaded ✓</p>}
      {busy && <p className="text-xs text-lux-muted">Uploading…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export default function TeamInfoDocPage({ hubHref = "/team/hub" }: { hubHref?: string }) {
  const [pending, setPending] = useState<PendingDoc | null>(null);
  const [latest, setLatest] = useState<SubmittedDoc | null>(null);
  const [stats, setStats] = useState<InfoDocStats>({ usedLinks30d: 0, closedDeals30d: 0 });
  const [form, setForm] = useState<InfoDocForm>(defaultInfoDocForm());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/team/info-doc");
    const data = await res.json();
    if (!res.ok) return;
    setPending(data.pendingDoc || null);
    setLatest(data.latestSubmitted || null);
    setStats(data.stats || { usedLinks30d: 0, closedDeals30d: 0 });
    if (data.draftForm) setForm(data.draftForm);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patch<K extends keyof InfoDocForm>(key: K, value: InfoDocForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function submit() {
    if (!pending) return;
    setBusy(true);
    const res = await fetch("/api/team/info-doc/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId: pending.id, form }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      flash(data.error || "Could not submit");
      return;
    }
    flash("Info Doc submitted — thank you!");
    load();
  }

  if (!pending && !latest) {
    return (
      <div className="max-w-2xl mx-auto lux-card-elite p-8 text-center">
        <p className="text-4xl mb-3">📋</p>
        <h1 className="font-bricolage font-extrabold text-xl text-lux-text">Employee Info Doc</h1>
        <p className="text-sm text-lux-muted mt-2">No Info Doc request right now. Admin will send one when needed.</p>
        <Link href={hubHref} className="text-sm text-lux-cyan hover:underline mt-4 inline-block">
          ← Back to hub
        </Link>
      </div>
    );
  }

  if (!pending && latest) {
    const snap = latest.stats_snapshot;
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="lux-card-elite p-6 border-emerald-500/25">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-400 mb-1">Submitted</p>
          <h1 className="font-bricolage font-extrabold text-xl text-lux-text">Info Doc on file</h1>
          <p className="text-sm text-lux-muted mt-2">
            Ref {latest.reference_no}
            {latest.submitted_at ? ` · ${new Date(latest.submitted_at).toLocaleDateString()}` : ""}
          </p>
          {snap && (
            <p className="text-sm text-lux-muted mt-3 tabular-nums">
              At submission: {snap.usedLinks30d} links used (30d) · {snap.closedDeals30d} deals closed (30d)
            </p>
          )}
          <Link href={hubHref} className="text-sm text-lux-cyan hover:underline mt-4 inline-block">
            ← Back to hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {toast && (
        <div className="lux-card-elite border-lux-cyan/30 px-4 py-3 text-sm text-lux-cyan font-semibold">{toast}</div>
      )}

      <div>
        <Link href={hubHref} className="text-xs text-lux-muted hover:text-lux-cyan">
          ← Hub
        </Link>
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text mt-2">Employee Info Doc</h1>
        <p className="text-sm text-lux-muted mt-2 leading-relaxed">
          Complete all fields below. Upload clear photos of your government ID (front and back). Your outreach stats
          for the last 30 days are filled in automatically.
        </p>
        {pending?.admin_note && (
          <div className="mt-3 rounded-xl border border-lux-cyan/25 bg-lux-cyan/[0.06] px-4 py-3 text-sm text-lux-muted">
            <strong className="text-lux-cyan text-xs uppercase tracking-wide">Admin note:</strong> {pending.admin_note}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="lux-card-elite p-4 text-center">
          <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted">Links used (30 days)</p>
          <p className="font-bricolage font-extrabold text-2xl text-lux-cyan tabular-nums">{stats.usedLinks30d}</p>
        </div>
        <div className="lux-card-elite p-4 text-center">
          <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted">Deals closed (30 days)</p>
          <p className="font-bricolage font-extrabold text-2xl text-emerald-400 tabular-nums">{stats.closedDeals30d}</p>
        </div>
      </div>

      <div className="lux-card-elite p-5 space-y-5">
        <h2 className="font-bricolage font-bold text-lux-text">Government ID</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <FileUploadField
            label="ID front photo"
            kind="govt_id_front"
            docId={pending!.id}
            uploaded={Boolean(form.govtIdFrontPath)}
            onUploaded={(k, v) => patch(k, v)}
          />
          <FileUploadField
            label="ID back photo"
            kind="govt_id_back"
            docId={pending!.id}
            uploaded={Boolean(form.govtIdBackPath)}
            onUploaded={(k, v) => patch(k, v)}
          />
        </div>
        <input
          className="lux-input w-full"
          placeholder="Government ID card number *"
          value={form.govtIdNumber}
          onChange={(e) => patch("govtIdNumber", e.target.value)}
        />
        <input
          className="lux-input w-full"
          placeholder="Father's name *"
          value={form.fatherName}
          onChange={(e) => patch("fatherName", e.target.value)}
        />
      </div>

      <div className="lux-card-elite p-5 space-y-4">
        <h2 className="font-bricolage font-bold text-lux-text">Contact & address</h2>
        <textarea
          className="lux-input w-full min-h-[80px]"
          placeholder="Home address *"
          value={form.homeAddress}
          onChange={(e) => patch("homeAddress", e.target.value)}
        />
        <input
          className="lux-input w-full"
          placeholder="Your phone number"
          value={form.personalPhone}
          onChange={(e) => patch("personalPhone", e.target.value)}
        />
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            className="lux-input"
            placeholder="Emergency contact name *"
            value={form.emergencyContactName}
            onChange={(e) => patch("emergencyContactName", e.target.value)}
          />
          <input
            className="lux-input"
            placeholder="Emergency phone *"
            value={form.emergencyContactPhone}
            onChange={(e) => patch("emergencyContactPhone", e.target.value)}
          />
          <input
            className="lux-input"
            placeholder="Relation (e.g. spouse)"
            value={form.emergencyContactRelation}
            onChange={(e) => patch("emergencyContactRelation", e.target.value)}
          />
        </div>
      </div>

      <div className="lux-card-elite p-5 space-y-4">
        <h2 className="font-bricolage font-bold text-lux-text">Reference</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            className="lux-input"
            placeholder="Reference name *"
            value={form.referenceName}
            onChange={(e) => patch("referenceName", e.target.value)}
          />
          <input
            className="lux-input"
            placeholder="Reference phone *"
            value={form.referencePhone}
            onChange={(e) => patch("referencePhone", e.target.value)}
          />
          <input
            className="lux-input"
            placeholder="Relation / how they know you"
            value={form.referenceRelation}
            onChange={(e) => patch("referenceRelation", e.target.value)}
          />
        </div>
      </div>

      <div className="lux-card-elite p-5 space-y-4 border-lux-violet/20">
        <h2 className="font-bricolage font-bold text-lux-text">Education & employment</h2>
        <input
          className="lux-input w-full"
          placeholder="Qualification (degree, certification) *"
          value={form.qualification}
          onChange={(e) => patch("qualification", e.target.value)}
        />
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-lux-cyan block mb-1.5">
            Current employment * — helps us offer better opportunities
          </label>
          <textarea
            className="lux-input w-full min-h-[100px]"
            placeholder="Company, role, hours, income if any, why you're open to outreach work…"
            value={form.currentEmployment}
            onChange={(e) => patch("currentEmployment", e.target.value)}
          />
        </div>
        <FileUploadField
          label="Experience letter"
          kind="experience_letter"
          docId={pending!.id}
          uploaded={Boolean(form.experienceLetterPath)}
          onUploaded={(k, v) => patch(k, v)}
          optional
        />
      </div>

      <Button variant="lux-cyan" className="w-full h-11" disabled={busy} onClick={submit}>
        {busy ? "Submitting…" : "Submit Info Doc"}
      </Button>
      <p className="text-xs text-lux-muted text-center">Ref: {pending?.reference_no}</p>
    </div>
  );
}
