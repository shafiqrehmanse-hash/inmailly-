"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function CaseStudyDownloadButton({
  url,
  headers,
  label = "Generate case study",
}: {
  url: string;
  headers?: Record<string, string>;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function download() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not generate the report");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] || "InMailly-Case-Study.pdf";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <Button variant="lux-ghost" size="sm" disabled={busy} onClick={download}>
        {busy ? "Building PDF…" : label}
      </Button>
      {error && <span className="text-[0.65rem] text-red-400 max-w-[220px] text-right">{error}</span>}
    </span>
  );
}
