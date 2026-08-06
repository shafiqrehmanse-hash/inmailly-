"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fileToScreenshotDataUrl } from "@/lib/screenshot-data-url";
import type { Lead, LeadMessage } from "@/lib/types";
import { cn, formatRelative } from "@/lib/utils";

type ThreadRow = Lead & {
  lastPreview: string | null;
  lastSender: string | null;
  hasThread: boolean;
};

export default function TeamReplyAssistantPage() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [meetingLinkConfigured, setMeetingLinkConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftReply, setDraftReply] = useState("");
  const [prospectMessage, setProspectMessage] = useState<string | null>(null);
  const [suggestMeeting, setSuggestMeeting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", company: "", profile_url: "" });
  const [creating, setCreating] = useState(false);

  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team/reply-assistant");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return;
    setThreads(data.threads || []);
    setMeetingLinkConfigured(Boolean(data.meetingLinkConfigured));
  }, []);

  const loadThread = useCallback(async (leadId: string) => {
    setThreadLoading(true);
    setError("");
    const res = await fetch(`/api/team/reply-assistant/${leadId}`);
    const data = await res.json();
    setThreadLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load thread");
      return;
    }
    setLead(data.lead);
    setMessages(data.messages || []);
    setSelectedId(leadId);
    setImageDataUrl(null);
    setDraftReply("");
    setProspectMessage(null);
    setSuggestMeeting(false);
    window.setTimeout(() => dropRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const acceptImage = useCallback(async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Paste or upload a PNG/JPG screenshot of the LinkedIn thread.");
      return;
    }
    try {
      const normalized = await fileToScreenshotDataUrl(file);
      setImageDataUrl(normalized);
      setError("");
      setDraftReply("");
    } catch {
      setError("Could not process screenshot — try a smaller crop.");
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!selectedId) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        e.preventDefault();
        acceptImage(item.getAsFile());
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [selectedId, acceptImage]);

  async function generate(includeMeetingLink = false) {
    if (!selectedId || !imageDataUrl) {
      setError("Paste a screenshot of the LinkedIn conversation first.");
      dropRef.current?.focus();
      return;
    }
    setGenerating(true);
    setError("");
    const res = await fetch("/api/team/reply-assistant/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedId, imageDataUrl, includeMeetingLink }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.error || "Could not generate reply");
      return;
    }
    setDraftReply(data.reply || "");
    setProspectMessage(data.prospectMessage || null);
    setSuggestMeeting(Boolean(data.suggestMeeting));
  }

  async function markSent(markMeetingBooked = false) {
    if (!selectedId || !draftReply.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/team/reply-assistant/sent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId: selectedId,
        reply: draftReply.trim(),
        prospectMessage,
        markMeetingBooked,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    setImageDataUrl(null);
    setDraftReply("");
    setProspectMessage(null);
    setSuggestMeeting(false);
    await loadThread(selectedId);
    await loadThreads();
  }

  async function createThread() {
    if (!newForm.name.trim()) {
      setError("Prospect name is required");
      return;
    }
    setCreating(true);
    setError("");
    const res = await fetch("/api/team/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newForm.name.trim(),
        company: newForm.company.trim() || undefined,
        profile_url: newForm.profile_url.trim() || undefined,
        status: "contacted",
      }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Could not create thread");
      return;
    }
    setNewOpen(false);
    setNewForm({ name: "", company: "", profile_url: "" });
    await loadThreads();
    if (data.lead?.id) await loadThread(data.lead.id);
  }

  async function copyReply() {
    await navigator.clipboard.writeText(draftReply);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const selectedThread = threads.find((t) => t.id === selectedId);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-lux-violet/80 mb-2">
          AI outreach
        </p>
        <h1 className="font-bricolage font-extrabold text-[clamp(1.5rem,3.5vw,2rem)] lux-gradient-text">
          Reply Assistant
        </h1>
        <p className="text-sm text-lux-muted mt-2 max-w-2xl leading-relaxed">
          Paste a LinkedIn thread screenshot → AI drafts your next reply → copy, send on LinkedIn, then{" "}
          <strong className="text-lux-text">Mark sent</strong>. The full conversation stays saved per prospect.
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[560px]">
        {/* Thread list */}
        <aside className="lux-card-elite p-3 flex flex-col gap-2 max-h-[720px]">
          <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-white/[0.06]">
            <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-muted">Threads</p>
            <Button variant="lux-soft" size="sm" onClick={() => setNewOpen(true)}>
              + New
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {loading ? (
              <p className="text-xs text-lux-muted p-2">Loading…</p>
            ) : threads.length === 0 ? (
              <p className="text-xs text-lux-muted p-2 leading-relaxed">
                No leads yet. Create a thread or add leads on My Leads.
              </p>
            ) : (
              threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => loadThread(t.id)}
                  className={cn(
                    "w-full text-left rounded-xl px-3 py-2.5 border transition-colors",
                    selectedId === t.id
                      ? "border-lux-cyan/40 bg-lux-cyan/10"
                      : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                  )}
                >
                  <div className="font-semibold text-sm text-lux-text truncate">{t.name}</div>
                  {t.company && <div className="text-[0.65rem] text-lux-muted truncate">{t.company}</div>}
                  {t.lastPreview ? (
                    <p className="text-[0.62rem] text-lux-muted mt-1 line-clamp-2 italic">
                      {t.lastSender === "lead" ? "← " : "→ "}
                      {t.lastPreview}
                    </p>
                  ) : (
                    <p className="text-[0.62rem] text-lux-muted/70 mt-1">No messages yet</p>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main panel */}
        <div className="lux-card-elite p-4 sm:p-5 flex flex-col min-h-[480px]">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="text-4xl mb-3">💬</div>
              <p className="font-bricolage font-bold text-lg text-lux-text">Select or create a thread</p>
              <p className="text-sm text-lux-muted mt-2 max-w-sm">
                Pick a prospect on the left, paste their LinkedIn conversation screenshot, and get an AI reply
                trained on InMailly&apos;s service pitch.
              </p>
            </div>
          ) : threadLoading ? (
            <div className="flex-1 flex items-center justify-center text-lux-muted">Loading thread…</div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bricolage font-extrabold text-xl text-lux-text">
                      {lead?.name || selectedThread?.name}
                    </h2>
                    {lead && <Badge variant={lead.status}>{lead.status}</Badge>}
                  </div>
                  {lead?.company && <p className="text-sm text-lux-muted mt-0.5">{lead.company}</p>}
                  {lead?.profile_url && (
                    <a
                      href={lead.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-lux-cyan hover:underline mt-1 inline-block"
                    >
                      Open LinkedIn profile ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Message history */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[140px] max-h-[240px]">
                {messages.length === 0 ? (
                  <p className="text-xs text-lux-muted text-center py-6">
                    Thread empty — paste a screenshot to start. First reply will be saved when you mark sent.
                  </p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        m.sender === "team"
                          ? "ml-auto bg-lux-cyan/15 border border-lux-cyan/25 text-lux-text"
                          : "mr-auto bg-white/[0.04] border border-white/[0.08] text-lux-muted"
                      )}
                    >
                      <div className="text-[0.58rem] font-bold uppercase tracking-wider mb-1 opacity-70">
                        {m.sender === "team" ? "You" : lead?.name || "Prospect"}
                        {m.ai_generated && " · AI draft sent"}
                        {m.from_screenshot && " · from screenshot"}
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <div className="text-[0.58rem] opacity-50 mt-1">{formatRelative(m.created_at)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Screenshot paste */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  acceptImage(e.target.files?.[0] || null);
                  e.target.value = "";
                }}
              />

              <div
                ref={dropRef}
                tabIndex={0}
                role="button"
                onClick={() => dropRef.current?.focus()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  acceptImage(e.dataTransfer.files?.[0] || null);
                }}
                className={cn(
                  "rounded-xl border-2 border-dashed min-h-[120px] flex flex-col items-center justify-center gap-2 p-4 outline-none transition-all cursor-pointer mb-3",
                  dragOver
                    ? "border-lux-cyan bg-lux-cyan/15"
                    : imageDataUrl
                      ? "border-emerald-500/40 bg-emerald-500/[0.06]"
                      : "border-lux-violet/30 bg-lux-violet/[0.04] focus:border-lux-cyan"
                )}
              >
                {imageDataUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageDataUrl}
                      alt="Thread screenshot"
                      className="max-h-36 rounded-lg border border-white/10"
                    />
                    <p className="text-xs text-emerald-300 font-semibold">Screenshot ready</p>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📋</span>
                    <p className="text-sm font-semibold text-lux-text">Paste LinkedIn thread screenshot</p>
                    <p className="text-xs text-lux-muted">Ctrl+V · drag & drop · or upload</p>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <Button variant="lux-soft" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Upload
                </Button>
                {imageDataUrl && (
                  <Button
                    variant="lux-ghost"
                    size="sm"
                    onClick={() => {
                      setImageDataUrl(null);
                      setDraftReply("");
                    }}
                  >
                    Clear screenshot
                  </Button>
                )}
                <Button
                  variant="lux-cyan"
                  size="sm"
                  disabled={generating || !imageDataUrl}
                  onClick={() => generate(false)}
                >
                  {generating ? "Reading thread…" : "✦ Generate reply"}
                </Button>
                <Button
                  variant="lux-soft"
                  size="sm"
                  disabled={generating || !imageDataUrl}
                  onClick={() => generate(true)}
                  title={
                    meetingLinkConfigured
                      ? "Include your booking link in the reply"
                      : "Set REPLY_ASSISTANT_MEETING_LINK in env for a booking URL"
                  }
                >
                  📅 Meeting link reply
                </Button>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300 mb-3">
                  {error}
                </div>
              )}

              {prospectMessage && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 mb-3 text-sm">
                  <p className="text-[0.62rem] font-bold uppercase text-amber-400 mb-1">Detected from screenshot</p>
                  <p className="text-lux-muted italic">&ldquo;{prospectMessage}&rdquo;</p>
                  <p className="text-[0.62rem] text-lux-muted mt-1">Saved to thread when you mark sent.</p>
                </div>
              )}

              {suggestMeeting && !draftReply && (
                <p className="text-xs text-lux-cyan mb-2">
                  AI suggests offering a meeting — try &ldquo;Meeting link reply&rdquo;.
                </p>
              )}

              {draftReply && (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 space-y-3">
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-emerald-300">
                    Your reply — copy & send on LinkedIn
                  </p>
                  <textarea
                    className="lux-input w-full min-h-[120px] text-sm leading-relaxed"
                    value={draftReply}
                    onChange={(e) => setDraftReply(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="lux-soft" size="sm" onClick={copyReply}>
                      {copied ? "Copied!" : "Copy reply"}
                    </Button>
                    <Button variant="lux-success" size="sm" disabled={saving} onClick={() => markSent(false)}>
                      {saving ? "Saving…" : "✓ Mark sent"}
                    </Button>
                    <Button variant="lux" size="sm" disabled={saving} onClick={() => markSent(true)}>
                      Mark sent + meeting booked
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New thread modal */}
      {newOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="lux-card-elite p-6 w-full max-w-md space-y-4 border-lux-cyan/25">
            <h3 className="font-bricolage font-bold text-lg text-lux-text">New conversation thread</h3>
            <input
              className="lux-input w-full"
              placeholder="Prospect name *"
              value={newForm.name}
              onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
            />
            <input
              className="lux-input w-full"
              placeholder="Company (optional)"
              value={newForm.company}
              onChange={(e) => setNewForm({ ...newForm, company: e.target.value })}
            />
            <input
              className="lux-input w-full"
              placeholder="LinkedIn profile URL (optional)"
              value={newForm.profile_url}
              onChange={(e) => setNewForm({ ...newForm, profile_url: e.target.value })}
            />
            <div className="flex gap-2 pt-1">
              <Button variant="lux" disabled={creating} onClick={createThread}>
                {creating ? "Creating…" : "Create thread"}
              </Button>
              <Button variant="lux-ghost" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
