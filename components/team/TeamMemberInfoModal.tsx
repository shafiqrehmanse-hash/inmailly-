"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TeamAvatar from "@/components/team/TeamAvatar";
import { FOUNDER_BROADCAST_SIGNATURE, leaderBroadcastSignature, teamBroadcastEmail } from "@/lib/email-templates";
import { linkedinHref } from "@/lib/linkedin-profile-url";
import { whatsappHref } from "@/lib/utils";

export type TeamMemberInfo = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  photo_url?: string | null;
  linkedin_url?: string | null;
  role?: string | null;
  is_active?: boolean;
  invite_code?: string | null;
  last_login?: string | null;
  joined_at?: string | null;
  extras?: { label: string; value: string | number }[];
};

export default function TeamMemberInfoModal({
  member,
  onClose,
  mode,
  adminKey,
  leaderName,
  onNotify,
}: {
  member: TeamMemberInfo | null;
  onClose: () => void;
  mode: "admin" | "leader";
  adminKey?: string;
  leaderName?: string;
  onNotify?: (message: string, type?: "error" | "success") => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setSubject("");
    setMessage("");
    setSending(false);
  }, [member?.id]);

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

  if (!member) return null;

  const wa = whatsappHref(member.phone);
  const li = linkedinHref(member.linkedin_url);

  async function sendConcern() {
    if (!member) return;
    if (!subject.trim() || !message.trim()) {
      onNotify?.("Subject and message are required", "error");
      return;
    }
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
        send_to_all: false,
        member_ids: [member.id],
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      onNotify?.(data.error || "Could not send email", "error");
      return;
    }
    onNotify?.(`Email sent to ${member.name}`, "success");
    setSubject("");
    setMessage("");
  }

  return (
    <Modal open={Boolean(member)} onClose={onClose} title={member.name} wide>
      <div className="grid lg:grid-cols-[minmax(0,280px)_1fr] gap-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <TeamAvatar name={member.name} photoUrl={member.photo_url} size="lg" />
            <div className="min-w-0">
              <p className="font-bricolage font-bold text-lux-text">{member.name}</p>
              {member.role && (
                <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted mt-0.5">{member.role}</p>
              )}
              {member.is_active === false && (
                <p className="text-[0.62rem] uppercase font-bold text-red-300 mt-1">Inactive</p>
              )}
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <InfoRow label="Email">
              <a href={`mailto:${member.email}`} className="text-lux-cyan hover:underline break-all">
                {member.email}
              </a>
            </InfoRow>
            <InfoRow label="Phone">
              {member.phone ? (
                <div className="space-y-1">
                  <p className="text-lux-text">{member.phone}</p>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-300 hover:underline"
                    >
                      WhatsApp →
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-lux-muted">Not added yet</span>
              )}
            </InfoRow>
            <InfoRow label="LinkedIn">
              {li ? (
                <a
                  href={li}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lux-cyan hover:underline break-all"
                >
                  {li.replace(/^https?:\/\/(www\.)?/i, "")}
                </a>
              ) : (
                <span className="text-lux-muted">Not added yet</span>
              )}
            </InfoRow>
            {member.invite_code && (
              <InfoRow label="Invite key">
                <span className="font-mono text-amber-200/90">{member.invite_code}</span>
              </InfoRow>
            )}
            {member.extras?.map((x) => (
              <InfoRow key={x.label} label={x.label}>
                <span className="text-lux-text tabular-nums">{x.value}</span>
              </InfoRow>
            ))}
          </dl>
        </div>

        <div className="space-y-3 min-w-0">
          <div>
            <h3 className="font-bricolage font-bold text-lux-text">Email this member</h3>
            <p className="text-xs text-lux-muted mt-1">
              Same black InMailly email as team broadcasts. Write your subject and message — it sends exactly as
              written.
            </p>
          </div>
          <input
            className="lux-input"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="lux-input min-h-[120px]"
            placeholder="Write your message…&#10;&#10;Use blank lines between paragraphs."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant="lux" onClick={sendConcern} disabled={sending} className="w-full">
            {sending ? "Sending…" : `Send email to ${member.name}`}
          </Button>
          <div className="lux-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-lux-muted">Live preview</span>
              <span className="text-[0.65rem] text-lux-cyan">Black background · same as inbox</span>
            </div>
            <iframe
              title="Email preview"
              srcDoc={previewHtml}
              className="w-full h-[min(420px,50vh)] bg-[#07070b] border-0"
              sandbox=""
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.62rem] font-bold uppercase tracking-wider text-lux-muted">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
