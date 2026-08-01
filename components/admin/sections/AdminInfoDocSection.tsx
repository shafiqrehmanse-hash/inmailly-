"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import AdminInfoDocsPanel from "@/components/admin/AdminInfoDocsPanel";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import type { TeamMember } from "@/lib/types";

export default function AdminInfoDocSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pickMember, setPickMember] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers((data.members || []).filter((m: TeamMember) => m.is_active));
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  function fillFromMember(memberId: string) {
    const m = members.find((x) => x.id === memberId);
    if (!m) return;
    setEmployeeName(m.name);
    setEmployeeEmail(m.email);
  }

  async function sendToDashboard() {
    if (!employeeName.trim() || !employeeEmail.trim()) {
      showToast("Employee name and email required", "error");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/admin/info-docs?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        employeeName: employeeName.trim(),
        employeeEmail: employeeEmail.trim().toLowerCase(),
        adminNote: adminNote.trim() || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      showToast(data.error || "Send failed", "error");
      return;
    }
    showToast(
      data.emailSent
        ? `Info Doc sent to ${employeeEmail}`
        : `Created — email skipped (check Resend)`,
      "success"
    );
    window.dispatchEvent(new Event("inmailly-info-docs-updated"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">📋 Employee Info Docs</h1>
        <p className="text-sm text-lux-muted mt-2 max-w-2xl leading-relaxed">
          Send an Info Doc request to a team member. They fill ID details, emergency contact, references, and
          employment info on their dashboard. Last 30 days links used and deals closed are attached automatically.
        </p>
      </div>

      <div className="lux-card p-5 space-y-4">
        <h3 className="font-bricolage font-bold">Send to employee dashboard</h3>
        <LuxSelect
          value={pickMember}
          onChange={(v) => {
            setPickMember(v);
            fillFromMember(v);
          }}
          placeholder="Fill from team member…"
          options={[
            { value: "", label: "Select member (optional)" },
            ...members.map((m) => ({ value: m.id, label: `${m.name} · ${m.email}` })),
          ]}
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className="lux-input"
            placeholder="Employee name *"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
          />
          <input
            className="lux-input"
            placeholder="Employee email *"
            value={employeeEmail}
            onChange={(e) => setEmployeeEmail(e.target.value)}
          />
        </div>
        <textarea
          className="lux-input min-h-[72px]"
          placeholder="Optional note shown to employee (e.g. deadline, why we need this)"
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
        />
        <Button variant="lux-cyan" disabled={busy} onClick={sendToDashboard}>
          {busy ? "Sending…" : "Send Info Doc to dashboard"}
        </Button>
        <p className="text-xs text-lux-muted">
          Replaces any pending Info Doc for the same email. Employee gets an email with a link to fill the form.
        </p>
      </div>

      <AdminInfoDocsPanel />
    </div>
  );
}
