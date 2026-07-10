"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import {
  FOUNDER_BROADCAST_SIGNATURE,
  leaderBroadcastSignature,
  teamBroadcastEmail,
} from "@/lib/email-templates";
import type { TeamMember } from "@/lib/types";

type MemberOption = Pick<TeamMember, "id" | "name" | "email">;

export default function TeamBroadcastComposer({
  mode,
  adminKey,
  leaderName,
  onNotify,
}: {
  mode: "admin" | "leader";
  adminKey?: string;
  leaderName?: string;
  onNotify?: (message: string, type?: "error" | "success") => void;
}) {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  const signature =
    mode === "admin"
      ? FOUNDER_BROADCAST_SIGNATURE
      : leaderBroadcastSignature(leaderName || "Team Leader");

  const previewHtml = useMemo(
    () =>
      teamBroadcastEmail({
        subject: subject.trim() || "Your subject line",
        message: message.trim() || "Your message will appear here…",
        signature,
      }),
    [subject, message, signature]
  );

  function flash(msg: string, isError?: boolean) {
    setToast(isError ? `⚠ ${msg}` : msg);
    setTimeout(() => setToast(""), 3500);
  }

  function notify(msg: string, type?: "error" | "success") {
    if (onNotify) onNotify(msg, type);
    else flash(msg, type === "error");
  }

  const loadMembers = useCallback(async () => {
    if (mode === "admin" && adminKey) {
      const res = await fetch(`/api/admin/members?key=${adminKey}`);
      const data = await res.json();
      setMembers(
        (data.members || []).filter(
          (m: TeamMember) =>
            m.is_active && m.role !== "campaign_manager" && m.role !== "content_manager"
        )
      );
      return;
    }
    const res = await fetch("/api/team/leader/members");
    const data = await res.json();
    if (res.ok) setMembers(data.members || []);
  }, [mode, adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

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
      notify("Subject and message are required", "error");
      return;
    }
    if (!sendToAll && selectedIds.size === 0) {
      notify("Select at least one member", "error");
      return;
    }
    const countLabel = sendToAll ? "all active team members" : `${selectedIds.size} member(s)`;
    if (!confirm(`Send email to ${countLabel}?`)) return;

    setSending(true);
    const url =
      mode === "admin"
        ? `/api/admin/team/broadcast?key=${adminKey}`
        : "/api/team/leader/broadcast";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (mode === "admin" && adminKey) headers["x-admin-key"] = adminKey;

    const res = await fetch(url, {
      method: "POST",
      headers,
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
      notify(data.error || "Could not send", "error");
      return;
    }
    const okMsg = `Sent to ${data.sent} of ${data.total} members`;
    notify(okMsg, "success");
    if (mode === "admin" && !data.configured) {
      notify("RESEND_API_KEY not set — emails may not have delivered", "error");
    }
    setMessage("");
  }

  const signerLine =
    mode === "admin"
      ? `${FOUNDER_BROADCAST_SIGNATURE.name} · ${FOUNDER_BROADCAST_SIGNATURE.title}`
      : `${leaderName || "You"} · Team Leader, InMailly`;

  return (
    <div className="space-y-6">
      {toast && mode === "leader" && (
        <div className="lux-toast-anchor" role="status">
          <div className="lux-toast-success text-center">{toast}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-6 items-start">
        <div className="lux-card p-5 space-y-4">
          <div>
            <h2 className="font-bricolage font-bold text-lux-text">Compose</h2>
            <p className="text-xs text-lux-muted mt-1">
              Dark HTML email with signature: <span className="text-lux-cyan">{signerLine}</span>
              <span className="block mt-1 text-lux-muted/80">Your message is sent exactly as written — no auto greeting added.</span>
            </p>
          </div>

          <input
            className="lux-input"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="lux-input min-h-[160px]"
            placeholder="Write your message…&#10;&#10;Use blank lines between paragraphs."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="flex flex-wrap gap-4 items-center text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-lux-muted">
              <input type="radio" checked={sendToAll} onChange={() => setSendToAll(true)} />
              {mode === "leader" ? "All outreach workers" : "All active members"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-lux-muted">
              <input type="radio" checked={!sendToAll} onChange={() => setSendToAll(false)} />
              Selected only
            </label>
          </div>

          {!sendToAll && (
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    selectedIds.has(m.id)
                      ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
                      : "text-lux-muted border-white/[0.08] hover:border-white/15"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}

          <Button variant="lux" onClick={sendBroadcast} disabled={sending} className="w-full">
            {sending ? "Sending…" : "Send email"}
          </Button>
        </div>

        <div className="lux-card overflow-hidden min-h-[480px]">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-lux-muted">Live preview</span>
            <span className="text-[0.65rem] text-lux-cyan">Black background · same as inbox</span>
          </div>
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            className="w-full h-[min(720px,75vh)] bg-[#07070b] border-0"
            sandbox=""
          />
        </div>
      </div>
    </div>
  );
}
