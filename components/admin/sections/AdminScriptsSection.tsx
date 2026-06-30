"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import { SCRIPT_LIMITS } from "@/lib/scripts";

export default function AdminScriptsSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [addNote, setAddNote] = useState("");
  const [inmailSubject, setInmailSubject] = useState("");
  const [inmailBody, setInmailBody] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/scripts?key=${adminKey}`);
    const data = await res.json();
    setAddNote(data.add_note || "");
    setInmailSubject(data.inmail_subject || "");
    setInmailBody(data.inmail_body || "");
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveScript() {
    await fetch(`/api/admin/scripts?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        add_note: addNote,
        inmail_subject: inmailSubject,
        inmail_body: inmailBody,
      }),
    });
    showToast("Scripts saved — team sees them in the daily scripts bar");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">Daily scripts</h1>
        <p className="text-sm text-lux-muted mt-1">
          Set outreach copy — team members copy subject and script separately from their workspace bar.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="lux-card-elite p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bricolage font-bold text-lux-text">Add Note</h3>
            <span className="text-[0.62rem] font-bold uppercase tracking-wider text-lux-muted">
              Max {SCRIPT_LIMITS.add_note} chars
            </span>
          </div>
          <p className="text-xs text-lux-muted -mt-1">Connection request note — paste on LinkedIn profile</p>
          <textarea
            className="lux-input min-h-[200px] rounded-xl"
            value={addNote}
            onChange={(e) => setAddNote(e.target.value)}
            placeholder="Hi {name}, noticed your work at {company}…"
          />
          <p className="text-[0.65rem] text-lux-muted tabular-nums">
            {addNote.length} / {SCRIPT_LIMITS.add_note} characters
          </p>
        </div>

        <div className="lux-card-elite p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bricolage font-bold text-lux-text">InMail</h3>
            <span className="text-[0.62rem] font-bold uppercase tracking-wider text-lux-muted">
              Body up to {SCRIPT_LIMITS.inmail.toLocaleString()} chars
            </span>
          </div>
          <p className="text-xs text-lux-muted -mt-1">Subject and script are separate — team copies each on its own</p>
          <div className="space-y-2">
            <label className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Subject</label>
            <input
              className="lux-input rounded-xl"
              value={inmailSubject}
              onChange={(e) => setInmailSubject(e.target.value)}
              placeholder="Quick question about your outreach…"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Script</label>
            <textarea
              className="lux-input min-h-[160px] rounded-xl"
              value={inmailBody}
              onChange={(e) => setInmailBody(e.target.value)}
              placeholder="Hi {name}, I came across your profile and…"
            />
          </div>
          <p className="text-[0.65rem] text-lux-muted tabular-nums">
            {inmailBody.length} / {SCRIPT_LIMITS.inmail.toLocaleString()} characters
          </p>
        </div>
      </div>

      <Button variant="lux" onClick={saveScript} className="lux-btn-glow rounded-xl">
        Save scripts
      </Button>
    </div>
  );
}
