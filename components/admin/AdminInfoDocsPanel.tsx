"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { EmployeeInfoDocRow, InfoDocForm, InfoDocStats } from "@/lib/info-doc";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function AdminInfoDocsPanel() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [docs, setDocs] = useState<EmployeeInfoDocRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/info-docs?key=${adminKey}`);
    const data = await res.json();
    setDocs(data.docs || []);
  }, [adminKey]);

  useEffect(() => {
    load();
    const fn = () => load();
    window.addEventListener("inmailly-info-docs-updated", fn);
    return () => window.removeEventListener("inmailly-info-docs-updated", fn);
  }, [load]);

  async function expand(id: string) {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    const res = await fetch(`/api/admin/info-docs/${id}?key=${adminKey}`, {
      headers: { "x-admin-key": adminKey },
    });
    const data = await res.json();
    if (res.ok) setFileUrls(data.fileUrls || {});
  }

  async function markReviewed(id: string) {
    setBusy(id);
    const res = await fetch(`/api/admin/info-docs/${id}?key=${adminKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ status: "reviewed" }),
    });
    setBusy(null);
    if (!res.ok) {
      showToast("Could not mark reviewed", "error");
      return;
    }
    showToast("Marked as reviewed");
    load();
  }

  const submitted = docs.filter((d) => d.status === "submitted" || d.status === "reviewed");

  if (submitted.length === 0) {
    return (
      <div className="lux-card p-5 text-sm text-lux-muted">
        No submitted Info Docs yet. Send a request to a team member above.
      </div>
    );
  }

  return (
    <div className="lux-card overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06]">
        <h3 className="font-bricolage font-bold">Submitted Info Docs</h3>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {submitted.map((d) => {
          const form = d.form_data as InfoDocForm;
          const stats = d.stats_snapshot as InfoDocStats | null;
          const open = expanded === d.id;
          return (
            <div key={d.id} className="px-5 py-4">
              <button
                type="button"
                className="w-full text-left flex flex-wrap items-center justify-between gap-2"
                onClick={() => expand(d.id)}
              >
                <div>
                  <span className="font-semibold text-lux-text">{d.employee_name}</span>
                  <span className="text-xs text-lux-muted ml-2">{d.employee_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[0.6rem] font-bold uppercase px-2 py-0.5 rounded ${
                      d.status === "reviewed"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {d.status}
                  </span>
                  <span className="text-xs text-lux-muted">{open ? "▲" : "▼"}</span>
                </div>
              </button>

              {open && (
                <div className="mt-4 space-y-3 text-sm text-lux-muted">
                  <p>
                    <strong className="text-lux-text">Ref:</strong> {d.reference_no}
                    {d.submitted_at && (
                      <> · Submitted {new Date(d.submitted_at).toLocaleString()}</>
                    )}
                  </p>
                  {stats && (
                    <p className="tabular-nums">
                      30-day stats: {stats.usedLinks30d} links used · {stats.closedDeals30d} deals closed
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <p>ID #: {form.govtIdNumber}</p>
                    <p>Father: {form.fatherName}</p>
                    <p className="sm:col-span-2">Address: {form.homeAddress}</p>
                    <p>
                      Emergency: {form.emergencyContactName} · {form.emergencyContactPhone}
                    </p>
                    <p>
                      Reference: {form.referenceName} · {form.referencePhone}
                    </p>
                    <p className="sm:col-span-2">Qualification: {form.qualification}</p>
                    <p className="sm:col-span-2">
                      <strong className="text-lux-cyan">Employment:</strong> {form.currentEmployment}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {form.govtIdFrontPath && fileUrls[form.govtIdFrontPath] && (
                      <a
                        href={fileUrls[form.govtIdFrontPath]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lux-cyan text-xs hover:underline"
                      >
                        View ID front ↗
                      </a>
                    )}
                    {form.govtIdBackPath && fileUrls[form.govtIdBackPath] && (
                      <a
                        href={fileUrls[form.govtIdBackPath]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lux-cyan text-xs hover:underline"
                      >
                        View ID back ↗
                      </a>
                    )}
                    {form.experienceLetterPath && fileUrls[form.experienceLetterPath] && (
                      <a
                        href={fileUrls[form.experienceLetterPath]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lux-cyan text-xs hover:underline"
                      >
                        Experience letter ↗
                      </a>
                    )}
                  </div>
                  {d.status === "submitted" && (
                    <Button
                      variant="lux-soft"
                      size="sm"
                      disabled={busy === d.id}
                      onClick={() => markReviewed(d.id)}
                    >
                      Mark reviewed
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
