"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export type ClientResponseDetail = {
  id: string;
  name: string;
  title?: string;
  preview: string;
  time: string;
  status: string;
  profileUrl?: string | null;
  clientFollowupMessage?: string | null;
  clientFollowupAt?: string | null;
};

export default function ClientResponseModal({
  response,
  onClose,
  onSaved,
  readOnly = false,
}: {
  response: ClientResponseDetail | null;
  onClose: () => void;
  onSaved?: (updated: Pick<ClientResponseDetail, "id" | "clientFollowupMessage" | "clientFollowupAt">) => void;
  /** Demo / preview mode — show UI but don't submit */
  readOnly?: boolean;
}) {
  const linkedIn = normalizeLinkedInUrl(response?.profileUrl);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!response) return;
    setMessage(response.clientFollowupMessage || "");
    setError("");
    setSuccess(false);
  }, [response]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response || readOnly) return;

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/client/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: response.id, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send follow-up");
        setSaving(false);
        return;
      }
      setSuccess(true);
      onSaved?.({
        id: response.id,
        clientFollowupMessage: data.client_followup_message,
        clientFollowupAt: data.client_followup_at,
      });
    } catch {
      setError("Network error — please try again");
    }
    setSaving(false);
  }

  const hasExisting = Boolean(response?.clientFollowupMessage);

  return (
    <AnimatePresence>
      {response && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-4 top-[6vh] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[81] w-full sm:max-w-lg max-h-[88vh] overflow-y-auto"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
          >
            <div className="lux-card border-lux-cyan/25 shadow-[0_0_60px_rgba(34,211,238,0.12)] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] bg-lux-bg2/80 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.24em] text-lux-cyan font-semibold mb-1">
                    Lead response
                  </p>
                  <h2 className="font-bricolage font-extrabold text-xl text-lux-text">{response.name}</h2>
                  {response.title && (
                    <p className="text-sm text-lux-muted mt-0.5">{response.title}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-lux-muted hover:text-lux-text text-xl leading-none px-2"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[0.6rem] uppercase tracking-wider px-2.5 py-1 bg-lux-blue/15 text-lux-cyan border border-lux-blue/25">
                    {response.status}
                  </span>
                  <span className="text-[0.65rem] text-lux-muted">{response.time}</span>
                  {hasExisting && (
                    <span className="text-[0.6rem] uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      Follow-up sent
                    </span>
                  )}
                </div>

                <div className="border border-white/[0.08] bg-lux-bg2/50 p-4">
                  <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted mb-2">What they said</p>
                  <p className="text-sm text-lux-text leading-relaxed whitespace-pre-wrap">{response.preview}</p>
                </div>

                {linkedIn ? (
                  <a
                    href={linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center justify-center gap-2 w-full py-3 px-4",
                      "bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-sm transition-colors",
                      "shadow-[0_8px_24px_rgba(10,102,194,0.35)]"
                    )}
                  >
                    <LinkedInIcon />
                    Open LinkedIn profile →
                  </a>
                ) : (
                  <div className="text-center text-sm text-lux-muted border border-dashed border-white/[0.1] py-3 px-3">
                    No LinkedIn URL on file — your team can still send your follow-up once you submit it below.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="border border-lux-cyan/20 bg-lux-cyan/[0.04] p-4 space-y-3">
                  <div>
                    <p className="text-[0.62rem] uppercase tracking-wider text-lux-cyan font-semibold mb-1">
                      Your follow-up message
                    </p>
                    <p className="text-xs text-lux-muted leading-relaxed">
                      Write what you want your team to send to this lead on LinkedIn. They&apos;ll receive it
                      instantly and handle the send.
                    </p>
                  </div>
                  <textarea
                    className="lux-input min-h-[120px] text-sm w-full resize-y"
                    placeholder="e.g. Thanks for getting back to me! Would Tuesday at 2pm work for a quick 15-min call to walk through pricing?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={readOnly || saving}
                    maxLength={4000}
                  />
                  <div className="flex items-center justify-between text-[0.6rem] text-lux-muted">
                    <span>{message.length}/4000</span>
                    {response.clientFollowupAt && (
                      <span>Last sent {formatDate(response.clientFollowupAt)}</span>
                    )}
                  </div>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                  {success && (
                    <p className="text-sm text-emerald-400">
                      Sent to your team — they&apos;ll follow up on LinkedIn shortly.
                    </p>
                  )}
                  {readOnly ? (
                    <div className="text-center text-xs text-lux-muted border border-dashed border-white/10 py-3">
                      Sample data — follow-ups work on your live campaign dashboard.
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={saving || message.trim().length < 10}
                      className="w-full lux-btn-primary py-3 font-bricolage font-extrabold disabled:opacity-50"
                    >
                      {saving
                        ? "Sending…"
                        : hasExisting
                          ? "Update follow-up for team →"
                          : "Send follow-up to team →"}
                    </button>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.126 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function normalizeLinkedInUrl(url?: string | null) {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.includes("linkedin.com")) return `https://${trimmed.replace(/^\/\//, "")}`;
  return null;
}
