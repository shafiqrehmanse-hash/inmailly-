"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { buildWhitelabelDashboardHtml } from "@/lib/whitelabel-html";

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

  const load = useCallback(() => {
    fetch("/api/client/whitelabel")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setInfo(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function downloadFile() {
    if (!info?.embedUrl) return;
    const html = buildWhitelabelDashboardHtml({
      embedUrl: info.embedUrl,
      pageTitle: `${info.companyName} — Campaign Dashboard`,
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
        Download one HTML file, upload it to your website folder (cPanel, Netlify, any host). No need to edit{" "}
        <code className="text-lux-text/80">index.html</code> — just open{" "}
        <code className="text-lux-text/80">yourdomain.com/{info.filename}</code> or link to it from your menu.
        Data syncs automatically from InMailly.
      </p>

      <ol className="mt-4 space-y-2 text-sm text-lux-muted list-decimal list-inside">
        <li>Click download below</li>
        <li>Upload <strong className="text-lux-text">{info.filename}</strong> to your site&apos;s public folder</li>
        <li>Visit that URL — your live campaign data appears instantly</li>
      </ol>

      <div className="flex flex-wrap gap-2 mt-5">
        <Button variant="lux-cyan" size="sm" onClick={downloadFile}>
          Download {info.filename}
        </Button>
        <a href={info.embedUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="lux-soft" size="sm" type="button">
            Preview embed
          </Button>
        </a>
      </div>

      <p className="text-[0.62rem] text-lux-muted mt-4">
        Project: {info.projectName} · Updates every time your team logs activity in InMailly
      </p>
    </div>
  );
}
