"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

type MemberOption = { id: string; name: string; email: string };

export default function AdminWelcomeEmailSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);

  const selected = members.find((m) => m.email === selectedEmail);
  const firstName = selected?.name.trim().split(" ")[0] || "Team";

  const loadPreview = useCallback(async () => {
    const res = await fetch(
      `/api/admin/team/welcome-email?key=${adminKey}&firstName=${encodeURIComponent(firstName)}`
    );
    const data = await res.json();
    if (res.ok) {
      setPreviewHtml(data.html || "");
      setSubject(data.subject || "");
    }
  }, [adminKey, firstName]);

  useEffect(() => {
    fetch(`/api/admin/members?key=${adminKey}`)
      .then((r) => r.json())
      .then((d) => {
        const list = (d.members || [])
          .filter((m: { role: string }) => m.role !== "campaign_manager")
          .map((m: { id: string; name: string; email: string }) => ({
            id: m.id,
            name: m.name,
            email: m.email,
          }));
        setMembers(list);
        if (list[0] && !selectedEmail) setSelectedEmail(list[0].email);
      });
  }, [adminKey, selectedEmail]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  async function sendWelcome() {
    if (!selectedEmail) {
      showToast("Select a team member", "error");
      return;
    }
    setSending(true);
    const res = await fetch(`/api/admin/team/welcome-email?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ email: selectedEmail }),
    });
    const data = await res.json();
    setSending(false);
    if (data.error) showToast(data.error, "error");
    else showToast(data.skipped ? "Email skipped (Resend not configured)" : `Welcome sent to ${data.sentTo}`);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Team welcome email</h1>
        <p className="text-sm text-lux-muted mt-1">
          Preview and send the same dark HTML welcome members get after email verification.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="lux-card p-5 space-y-4 h-fit">
          <h3 className="font-bricolage font-bold text-lux-text">Send to member</h3>
          <LuxSelect
            value={selectedEmail}
            onChange={setSelectedEmail}
            options={members.map((m) => ({ value: m.email, label: `${m.name} · ${m.email}` }))}
          />
          {subject && (
            <div className="text-xs text-lux-muted border border-white/[0.06] bg-lux-bg2/50 px-3 py-2 rounded-lg">
              <span className="text-lux-muted/70 uppercase tracking-wider text-[0.58rem] block mb-1">Subject</span>
              {subject}
            </div>
          )}
          <Button variant="lux" className="w-full" onClick={sendWelcome} disabled={sending || !selectedEmail}>
            {sending ? "Sending…" : "Send welcome email"}
          </Button>
          <p className="text-[0.68rem] text-lux-muted leading-relaxed">
            Use after verification or when an admin-created account missed the automatic welcome.
          </p>
        </div>

        <div className="lux-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-lux-muted">Live preview</span>
            <span className="text-[0.65rem] text-lux-cyan">Black background · same as inbox</span>
          </div>
          {previewHtml ? (
            <iframe
              title="Welcome email preview"
              srcDoc={previewHtml}
              className="w-full h-[min(720px,70vh)] bg-[#07070b] border-0"
              sandbox=""
            />
          ) : (
            <p className="p-8 text-lux-muted text-sm">Loading preview…</p>
          )}
        </div>
      </div>
    </div>
  );
}
