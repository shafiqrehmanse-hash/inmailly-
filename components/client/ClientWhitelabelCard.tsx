"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { buildWhitelabelDashboardHtml, hashWhitelabelPasswordBrowser } from "@/lib/whitelabel-html";

type WhitelabelInfo = {
  eligible: boolean;
  signed: boolean;
  projectActive: boolean;
  whitelabelEnabled: boolean;
  embedToken: string | null;
  embedUrl: string | null;
  projectName: string;
  companyName: string;
  filename: string;
  needsContract: boolean;
};

export default function ClientWhitelabelCard() {
  const [info, setInfo] = useState<WhitelabelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(() => {
    fetch("/api/client/whitelabel")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setInfo(d);
          setClientName((prev) => prev || d.companyName || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function downloadFile() {
    if (!info?.embedUrl) return;
    setFormError("");
    const brand = clientName.trim();
    if (!brand) {
      setFormError("Enter your client name — it appears on the login screen and dashboard.");
      return;
    }
    const pwd = password.trim();
    if (pwd.length < 6) {
      setFormError("Choose a password with at least 6 characters.");
      return;
    }
    if (pwd !== confirm.trim()) {
      setFormError("Passwords do not match.");
      return;
    }

    const passwordHash = await hashWhitelabelPasswordBrowser(pwd);
    const embedWithBrand = `${info.embedUrl}${info.embedUrl.includes("?") ? "&" : "?"}brand=${encodeURIComponent(brand)}`;
    const html = buildWhitelabelDashboardHtml({
      embedUrl: embedWithBrand,
      pageTitle: `${brand} Dashboard`,
      companyName: brand,
      passwordHash,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = info.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return null;

  if (!info) return null;

  if (info.needsContract) {
    return (
      <div className="lux-card-elite p-5 mb-6 border-violet-500/25 bg-violet-500/[0.05]">
        <p className="text-[0.62rem] font-bold uppercase tracking-widest text-violet-300 mb-1">
          White-label dashboard
        </p>
        <p className="text-sm text-lux-muted leading-relaxed">
          Sign your service agreement or go live to download a dashboard file for your own website — no coding
          required.
        </p>
        <Link href="/client/contract" className="text-sm text-lux-cyan hover:underline mt-2 inline-block">
          Review agreement →
        </Link>
      </div>
    );
  }

  if (!info.embedUrl) return null;

  return (
    <div className="lux-card-elite p-5 mb-6 border-lux-cyan/25 bg-lux-cyan/[0.04]">
      <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan mb-1">
        White-label — your website
      </p>
      <p className="font-bricolage font-bold text-lux-text text-lg">Host the dashboard on your domain</p>
      <p className="text-sm text-lux-muted mt-2 leading-relaxed">
        Download one HTML file, upload it to your website folder (cPanel, Netlify, any host). Visitors see{" "}
        <strong className="text-lux-text">your brand</strong> and a password login — no third-party branding on
        the page. Open{" "}
        <code className="text-lux-text/80">yourdomain.com/{info.filename}</code> or link it from your menu.
      </p>
      <p className="text-sm text-amber-300/90 mt-3 leading-relaxed border border-amber-500/30 bg-amber-500/10 px-3 py-2 rounded-lg">
        Important: after every download, <strong>replace the old HTML file</strong> on your host. Old files stay
        slow and outdated — the live page only updates when you overwrite it in cPanel / File Manager.
      </p>

      <div className="mt-4 space-y-3 max-w-md">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Client name</p>
          <p className="text-xs text-lux-muted mt-1 mb-2">
            Shown on the password login and inside the dashboard header — use your client&apos;s brand name (e.g.
            Peachy Leads).
          </p>
          <input
            className="lux-input"
            type="text"
            placeholder="e.g. Peachy Leads"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            autoComplete="organization"
          />
        </div>

        <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan pt-1">Board access password</p>
        <p className="text-xs text-lux-muted -mt-1">
          Required. Anyone visiting your white-label URL must enter this password first. Share it only with your
          client.
        </p>
        <div className="relative">
          <input
            className="lux-input pr-12"
            type={showPwd ? "text" : "password"}
            placeholder="Create password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lux-muted text-sm"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? "Hide" : "Show"}
          </button>
        </div>
        <input
          className="lux-input"
          type={showPwd ? "text" : "password"}
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        {formError && <p className="text-sm text-red-400 font-semibold">{formError}</p>}
      </div>

      <ol className="mt-4 space-y-2 text-sm text-lux-muted list-decimal list-inside">
        <li>Enter client name + password, then click download</li>
        <li>
          Upload <strong className="text-lux-text">{info.filename}</strong> to your site&apos;s public folder
          (replace the old file if you had one)
        </li>
        <li>Share the page URL + password with your client</li>
      </ol>

      <div className="flex flex-wrap gap-2 mt-5">
        <Button variant="lux-cyan" size="sm" onClick={downloadFile}>
          Download {info.filename}
        </Button>
      </div>

      <p className="text-[0.62rem] text-lux-muted mt-4">
        Project: {info.projectName} · Re-download anytime to rotate the password or refresh the board file
      </p>
    </div>
  );
}
