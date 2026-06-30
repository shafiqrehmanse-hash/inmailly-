"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { teamBroadcastPlainBody, teamBroadcastSignature } from "@/lib/admin-email-signature";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

export default function AdminBroadcastSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers((data.members || []).filter((m: TeamMember) => m.is_active && m.role !== "campaign_manager"));
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const preview = members[0]
    ? teamBroadcastPlainBody(members[0].name, message || "Your message here…")
    : `Hey Team,\n\n${message || "Your message here…"}${teamBroadcastSignature()}`;

  function toggleMember(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sendBroadcast() {
    if (!subject.trim() || !message.trim()) {
      showToast("Subject and message are required", "error");
      return;
    }
    if (!sendToAll && selectedIds.size === 0) {
      showToast("Select at least one member", "error");
      return;
    }
    if (!confirm(`Send email to ${sendToAll ? "all active team members" : `${selectedIds.size} member(s)`}?`)) return;

    setSending(true);
    const res = await fetch(`/api/admin/team/broadcast?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        subject,
        message,
        send_to_all: sendToAll,
        member_ids: Array.from(selectedIds),
      }),
    });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      showToast(data.error || "Could not send", "error");
      return;
    }
    showToast(`Sent to ${data.sent} of ${data.total} members`);
    if (!data.configured) showToast("RESEND_API_KEY not set — emails may not have delivered", "error");
    setMessage("");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Email team</h1>
        <p className="text-sm text-lux-muted mt-1">
          Plain-text broadcast with your founder signature appended automatically.
        </p>
      </div>

      <div className="lux-card p-5 space-y-4">
        <input
          className="lux-input"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          className="lux-input min-h-[180px]"
          placeholder="Write your message — keep it simple and direct…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={sendToAll} onChange={() => setSendToAll(true)} />
            All active outreach members
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={!sendToAll} onChange={() => setSendToAll(false)} />
            Selected members
          </label>
        </div>

        {!sendToAll && (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  selectedIds.has(m.id)
                    ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
                    : "text-lux-muted border-white/[0.08]"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        <Button variant="lux" onClick={sendBroadcast} disabled={sending} className="w-full">
          {sending ? "Sending…" : "Send broadcast"}
        </Button>
      </div>

      <div className="lux-card p-5">
        <p className="text-xs uppercase tracking-wide text-lux-muted mb-3">Preview (first member)</p>
        <pre className="text-sm text-lux-text whitespace-pre-wrap font-sans leading-relaxed">{preview}</pre>
      </div>
    </div>
  );
}
