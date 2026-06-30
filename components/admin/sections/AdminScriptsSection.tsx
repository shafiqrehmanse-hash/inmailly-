"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function AdminScriptsSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [addNote, setAddNote] = useState("");
  const [inmail, setInmail] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/scripts?key=${adminKey}`);
    const data = await res.json();
    setAddNote(data.add_note || "");
    setInmail(data.inmail || "");
  }, [adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveScript() {
    await fetch(`/api/admin/scripts?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ add_note: addNote, inmail }),
    });
    showToast("Scripts saved — team sees them in their daily bar");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Daily scripts</h1>
        <p className="text-sm text-lux-muted mt-1">Separate Add Note and InMail templates for outreach workers.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="lux-card p-5 space-y-3">
          <h3 className="font-bricolage font-bold text-lux-text">Add Note script</h3>
          <p className="text-xs text-lux-muted -mt-1">Shown when workers tap Add Note on a profile</p>
          <textarea
            className="lux-input min-h-[200px]"
            value={addNote}
            onChange={(e) => setAddNote(e.target.value)}
            placeholder="Hi {name}, noticed your work at {company}…"
          />
        </div>
        <div className="lux-card p-5 space-y-3">
          <h3 className="font-bricolage font-bold text-lux-text">InMail script</h3>
          <p className="text-xs text-lux-muted -mt-1">Template for LinkedIn InMail outreach</p>
          <textarea
            className="lux-input min-h-[200px]"
            value={inmail}
            onChange={(e) => setInmail(e.target.value)}
            placeholder="Subject line + body for InMail…"
          />
        </div>
      </div>

      <Button variant="lux" onClick={saveScript}>Save both scripts</Button>
    </div>
  );
}
