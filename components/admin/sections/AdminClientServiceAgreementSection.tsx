"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import AdminClientContractsPanel from "@/components/admin/AdminClientContractsPanel";
import {
  CLIENT_SERVICE_PRESETS,
  defaultClientServiceAgreementForm,
  formatInmailCount,
  formatLetterDate,
  formatUsd,
  type ClientServiceAgreementForm,
  type ClientServicePreset,
} from "@/lib/client-service-agreement";
import { clientServiceAgreementPreviewHtml } from "@/lib/client-service-agreement-html";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

const STORAGE_KEY = "inmailly-client-agreement-draft";

type ClientOption = {
  id: string;
  name: string;
  company_name: string | null;
  email: string;
  latest_project?: {
    id: string;
    name: string;
    inmail_package_size: number | null;
  } | null;
};

export default function AdminClientServiceAgreementSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [form, setForm] = useState<ClientServiceAgreementForm>(defaultClientServiceAgreementForm);
  const [preset, setPreset] = useState<ClientServicePreset>("starter_1000");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [pickClient, setPickClient] = useState("");
  const [linkedClientId, setLinkedClientId] = useState("");
  const [linkedProjectId, setLinkedProjectId] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailNote, setEmailNote] = useState("");
  const [busy, setBusy] = useState<"pdf" | "send" | "print" | "dashboard" | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setForm(JSON.parse(raw) as ClientServiceAgreementForm);
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

  const loadClients = useCallback(async () => {
    const res = await fetch(`/api/admin/clients?key=${adminKey}&limit=100`);
    const data = await res.json();
    setClients(data.clients || []);
  }, [adminKey]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  function applyPreset(p: ClientServicePreset) {
    setPreset(p);
    const patch = CLIENT_SERVICE_PRESETS[p].patch;
    setForm((f) => ({ ...f, ...patch }));
  }

  function fillFromClient(clientId: string) {
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
    setLinkedClientId(c.id);
    const pkg = c.latest_project?.inmail_package_size;
    let presetKey: ClientServicePreset = "custom";
    if (pkg === 200) presetKey = "trial_200";
    else if (pkg === 1000) presetKey = "starter_1000";
    else if (pkg === 5000) presetKey = "growth_5000";
    else if (pkg === 10000) presetKey = "pro_10000";
    else if (pkg === 20000) presetKey = "scale_20000";
    const presetPatch = presetKey !== "custom" ? CLIENT_SERVICE_PRESETS[presetKey].patch : {};
    if (presetKey !== "custom") setPreset(presetKey);
    setLinkedProjectId(c.latest_project?.id || "");
    setForm((f) => ({
      ...f,
      ...presetPatch,
      contactName: c.name,
      contactEmail: c.email,
      clientCompany: c.company_name || c.name,
      projectName: c.latest_project?.name || f.projectName,
      inmailPackageSize: pkg ? String(pkg) : f.inmailPackageSize,
    }));
  }

  const previewSrc = useMemo(() => {
    const html = clientServiceAgreementPreviewHtml(form);
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }, [form]);

  function patch<K extends keyof ClientServiceAgreementForm>(key: K, value: ClientServiceAgreementForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function downloadPdf() {
    if (!form.contactName.trim()) {
      showToast("Enter contact name first", "error");
      return;
    }
    setBusy("pdf");
    try {
      const res = await fetch(`/api/admin/client-service-agreement/pdf?key=${adminKey}`, {
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
      a.download = `InMailly-Agreement-${form.clientCompany.replace(/\s+/g, "-") || "client"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("PDF downloaded");
    } finally {
      setBusy(null);
    }
  }

  async function sendToDashboard() {
    if (!form.contactName.trim() || !form.contactEmail.trim()) {
      showToast("Name and email required", "error");
      return;
    }
    setBusy("dashboard");
    try {
      const res = await fetch(`/api/admin/client-contracts?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          form,
          clientId: linkedClientId || undefined,
          projectId: linkedProjectId || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) showToast(data.error, "error");
      else if (data.emailSkipped) showToast("Sent to portal (email skipped — no RESEND key)", "error");
      else showToast("Agreement sent — client signs at /client/contract");
      window.dispatchEvent(new Event("inmailly-client-contracts-updated"));
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail() {
    if (!form.contactEmail.trim()) {
      showToast("Contact email required", "error");
      return;
    }
    setBusy("send");
    try {
      const res = await fetch(`/api/admin/client-service-agreement/send?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ form, emailSubject, emailNote }),
      });
      const data = await res.json();
      if (data.error) showToast(data.error, "error");
      else if (data.skipped) showToast("Email skipped — RESEND_API_KEY not set", "error");
      else showToast(`Agreement sent to ${data.sentTo}`);
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

  const presetOptions = (Object.keys(CLIENT_SERVICE_PRESETS) as ClientServicePreset[]).map((k) => ({
    value: k,
    label: CLIENT_SERVICE_PRESETS[k].label,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">Client service agreements</h1>
        <p className="text-sm text-lux-muted mt-1 max-w-2xl">
          Package-based outreach agreements — build trust with transparent terms, dashboard access, and electronic
          signing in the client portal. Content auto-adjusts per InMail package.
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

          {clients.length > 0 && (
            <div className="lux-card-elite p-4">
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-violet mb-2">
                Fill from client
              </p>
              <LuxSelect
                value={pickClient}
                onChange={(id) => {
                  setPickClient(id);
                  if (id) fillFromClient(id);
                }}
                options={[
                  { value: "", label: "— Select client —" },
                  ...clients.map((c) => ({
                    value: c.id,
                    label: `${c.company_name || c.name} (${c.email})`,
                  })),
                ]}
              />
            </div>
          )}

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Client contact</p>
            <input
              className="lux-input"
              placeholder="Contact full name"
              value={form.contactName}
              onChange={(e) => patch("contactName", e.target.value)}
            />
            <input
              className="lux-input"
              type="email"
              placeholder="Email (required to send)"
              value={form.contactEmail}
              onChange={(e) => patch("contactEmail", e.target.value)}
            />
            <input
              className="lux-input"
              placeholder="Company name"
              value={form.clientCompany}
              onChange={(e) => patch("clientCompany", e.target.value)}
            />
            <input
              className="lux-input"
              placeholder="Contact title (e.g. CEO)"
              value={form.contactTitle}
              onChange={(e) => patch("contactTitle", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Campaign & package</p>
            <input
              className="lux-input"
              placeholder="Project / campaign name"
              value={form.projectName}
              onChange={(e) => patch("projectName", e.target.value)}
            />
            <input
              className="lux-input"
              placeholder="Package name (Starter, Growth…)"
              value={form.packageName}
              onChange={(e) => patch("packageName", e.target.value)}
            />
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[0.62rem] text-lux-muted">InMail quota</label>
                <input
                  className="lux-input mt-1"
                  type="number"
                  min={0}
                  value={form.inmailPackageSize}
                  onChange={(e) => patch("inmailPackageSize", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.62rem] text-lux-muted">Price (USD)</label>
                <input
                  className="lux-input mt-1"
                  type="number"
                  min={0}
                  value={form.packagePriceUsd}
                  onChange={(e) => patch("packagePriceUsd", e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.62rem] text-lux-muted">Per message</label>
                <input
                  className="lux-input mt-1"
                  placeholder="0.27"
                  value={form.pricePerMessageUsd}
                  onChange={(e) => patch("pricePerMessageUsd", e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-lux-cyan font-semibold">
              {formatInmailCount(form.inmailPackageSize)} InMails · {formatUsd(form.packagePriceUsd)}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[0.62rem] text-lux-muted">Campaign start</label>
                <input
                  className="lux-input mt-1"
                  type="date"
                  value={form.campaignStartDate}
                  onChange={(e) => patch("campaignStartDate", e.target.value)}
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
              className="lux-input"
              placeholder="Estimated duration"
              value={form.estimatedDuration}
              onChange={(e) => patch("estimatedDuration", e.target.value)}
            />
            <input
              className="lux-input font-mono text-sm"
              placeholder="Reference no."
              value={form.referenceNo}
              onChange={(e) => patch("referenceNo", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-violet">Agreement terms</p>
            <textarea
              className="lux-input min-h-[80px]"
              placeholder="Deliverables"
              value={form.deliverables}
              onChange={(e) => patch("deliverables", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[72px]"
              placeholder="Payment terms"
              value={form.paymentTerms}
              onChange={(e) => patch("paymentTerms", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[60px]"
              placeholder="Dashboard & transparency"
              value={form.dashboardAccess}
              onChange={(e) => patch("dashboardAccess", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[60px]"
              placeholder="Confidentiality"
              value={form.confidentialityTerms}
              onChange={(e) => patch("confidentialityTerms", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[60px]"
              placeholder="Refund policy"
              value={form.refundPolicy}
              onChange={(e) => patch("refundPolicy", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[60px]"
              placeholder="Custom opening (optional)"
              value={form.customOpening}
              onChange={(e) => patch("customOpening", e.target.value)}
            />
            <textarea
              className="lux-input min-h-[72px]"
              placeholder="Additional terms"
              value={form.additionalTerms}
              onChange={(e) => patch("additionalTerms", e.target.value)}
            />
          </div>

          <div className="lux-card-elite p-5 space-y-3">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-muted">InMailly signature</p>
            <input className="lux-input" value={form.signerName} onChange={(e) => patch("signerName", e.target.value)} />
            <input
              className="lux-input"
              value={form.signerTitle}
              onChange={(e) => patch("signerTitle", e.target.value)}
            />
            <input
              className="lux-input"
              value={form.providerName}
              onChange={(e) => patch("providerName", e.target.value)}
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
            <Button variant="lux" onClick={sendToDashboard} disabled={!!busy || !form.contactEmail}>
              {busy === "dashboard" ? "Sending…" : "Send to client portal for signature"}
            </Button>
            <Button variant="lux-soft" onClick={sendEmail} disabled={!!busy || !form.contactEmail}>
              {busy === "send" ? "Sending…" : "Email PDF only"}
            </Button>
          </div>
        </div>

        <div className="xl:sticky xl:top-6 space-y-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-muted">Live preview</p>
          <div className="lux-card-elite p-2 overflow-hidden rounded-xl border border-white/10 bg-slate-900/40">
            <iframe
              title="Service agreement preview"
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

      <AdminClientContractsPanel />
    </div>
  );
}
