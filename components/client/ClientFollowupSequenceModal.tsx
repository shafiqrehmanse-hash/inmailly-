"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ClientFollowupStep } from "@/lib/client-followup-sequence";

export type SequenceLead = {
  id: string;
  name: string;
  title?: string;
  preview: string;
  sequence?: ClientFollowupStep[];
  clientFollowupMessage?: string | null;
};

export default function ClientFollowupSequenceModal({
  leads,
  onClose,
  onSaved,
}: {
  leads: SequenceLead[];
  onClose: () => void;
  onSaved: (saved: { id: string; clientFollowupMessage: string; clientFollowupAt: string }[]) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { lead_reply: string; next_followup: string }>>({});
  const [sharedNext, setSharedNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const next: Record<string, { lead_reply: string; next_followup: string }> = {};
    for (const l of leads) {
      next[l.id] = { lead_reply: "", next_followup: "" };
    }
    setDrafts(next);
    setSharedNext("");
    setError("");
  }, [leads]);

  function patch(id: string, field: "lead_reply" | "next_followup", value: string) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  function applySharedNext() {
    if (!sharedNext.trim()) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const l of leads) {
        next[l.id] = { ...next[l.id], next_followup: sharedNext };
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const items = leads.map((l) => ({
      lead_id: l.id,
      lead_reply: drafts[l.id]?.lead_reply || "",
      next_followup: drafts[l.id]?.next_followup || "",
    }));
    const res = await fetch("/api/client/followup-sequence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save sequence");
      return;
    }
    onSaved(data.saved || []);
    onClose();
  }

  if (!mounted || !leads.length) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[210] flex items-start justify-center p-4 pt-[4vh] sm:pt-[6vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button type="button" aria-label="Close" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          role="dialog"
          aria-modal="true"
          className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto lux-card border-lux-cyan/25 bg-lux-card shadow-[0_0_60px_rgba(34,211,238,0.12)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.24em] text-lux-cyan font-semibold mb-1">
                Follow-up sequence
              </p>
              <h2 className="font-bricolage font-extrabold text-xl text-lux-text">
                They replied — add the next send
              </h2>
              <p className="text-sm text-lux-muted mt-1">
                Paste what each lead said after your follow-up, then write the next LinkedIn message for your team.
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-lux-muted hover:text-lux-text text-xl px-2">
              ×
            </button>
          </div>

          <form onSubmit={submit} className="p-5 space-y-5">
            {leads.length > 1 && (
              <div className="border border-white/[0.08] bg-lux-bg2/40 p-4 space-y-2">
                <p className="text-[0.62rem] uppercase tracking-wider text-lux-muted">Same next message for all</p>
                <textarea
                  className="lux-input min-h-[72px] text-sm w-full"
                  placeholder="Optional — write once, apply to every selected lead"
                  value={sharedNext}
                  onChange={(e) => setSharedNext(e.target.value)}
                />
                <button
                  type="button"
                  onClick={applySharedNext}
                  className="text-xs font-semibold text-lux-cyan hover:underline"
                >
                  Apply to all selected →
                </button>
              </div>
            )}

            {leads.map((l) => (
              <div key={l.id} className="border border-white/[0.08] bg-lux-bg2/30 p-4 space-y-3">
                <p className="font-semibold text-lux-text">{l.name}</p>
                {l.title && <p className="text-xs text-lux-muted -mt-2">{l.title}</p>}
                <p className="text-xs text-lux-muted italic line-clamp-2">First reply: {l.preview}</p>
                {(l.sequence || []).length > 0 && (
                  <ol className="space-y-1.5 text-xs">
                    {l.sequence!.map((s) => (
                      <li key={s.id} className="border border-white/[0.06] px-2.5 py-1.5">
                        <span className="uppercase tracking-wider text-[0.55rem] text-lux-cyan mr-2">
                          {s.kind === "lead_reply" ? "They said" : "You sent"}
                        </span>
                        <span className="text-lux-muted">{s.body}</span>
                      </li>
                    ))}
                  </ol>
                )}
                <label className="block text-[0.62rem] uppercase tracking-wider text-amber-300">Their new response</label>
                <textarea
                  className="lux-input min-h-[80px] text-sm w-full"
                  placeholder="What they replied after your follow-up…"
                  value={drafts[l.id]?.lead_reply || ""}
                  onChange={(e) => patch(l.id, "lead_reply", e.target.value)}
                  maxLength={4000}
                />
                <label className="block text-[0.62rem] uppercase tracking-wider text-lux-cyan">Next follow-up to send</label>
                <textarea
                  className="lux-input min-h-[80px] text-sm w-full"
                  placeholder="What your team should send next on LinkedIn…"
                  value={drafts[l.id]?.next_followup || ""}
                  onChange={(e) => patch(l.id, "next_followup", e.target.value)}
                  maxLength={4000}
                />
              </div>
            ))}

            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full lux-btn-primary py-3 font-bricolage font-extrabold disabled:opacity-50"
            >
              {saving ? "Saving…" : `Send sequence to team · ${leads.length} lead${leads.length === 1 ? "" : "s"}`}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
