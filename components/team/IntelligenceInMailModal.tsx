"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { displayLinkName } from "@/lib/links";
import type { OutreachLink } from "@/lib/types";

export default function IntelligenceInMailModal({
  open,
  link,
  onClose,
  onCompleted,
}: {
  open: boolean;
  link: OutreachLink | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState<"subject" | "body" | "both" | null>(null);

  useEffect(() => {
    if (!open) return;
    setImageDataUrl(null);
    setError("");
    setSubject(link?.generated_subject || "");
    setBody(link?.generated_body || "");
    setCopied(null);
  }, [open, link]);

  const onPaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (!item.type.startsWith("image/")) continue;
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        if (result.startsWith("data:image/")) {
          setImageDataUrl(result);
          setError("");
        }
      };
      reader.readAsDataURL(file);
      return;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, onPaste]);

  async function generate() {
    if (!link || !imageDataUrl) {
      setError("Paste a Print Screen of the LinkedIn profile first (Ctrl+V).");
      return;
    }
    setGenerating(true);
    setError("");
    const res = await fetch("/api/team/links/generate-inmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId: link.id, imageDataUrl }),
    });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setError(data.error || "Could not generate InMail");
      return;
    }
    setSubject(data.subject || "");
    setBody(data.body || "");
  }

  async function copyText(kind: "subject" | "body" | "both") {
    const text =
      kind === "subject"
        ? subject
        : kind === "body"
          ? body
          : `Subject: ${subject}\n\n${body}`;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  async function markComplete() {
    if (!link) return;
    setCompleting(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCompleting(false);
      setError("Session expired — refresh and try again");
      return;
    }
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!member) {
      setCompleting(false);
      setError("Team account not found");
      return;
    }
    await supabase
      .from("outreach_links")
      .update({
        status: "used",
        used_at: new Date().toISOString(),
        used_by_member_id: member.id,
      })
      .eq("id", link.id)
      .eq("member_id", member.id);
    setCompleting(false);
    onCompleted();
  }

  if (!link) return null;
  const name = displayLinkName(link);

  return (
    <Modal open={open} onClose={onClose} title="Intelligence InMail" wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-bricolage font-bold text-lux-text text-lg">{name}</p>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-lux-cyan hover:underline"
            >
              Open LinkedIn profile ↗
            </a>
          </div>
          <span className="text-[0.6rem] font-bold uppercase tracking-wider text-lux-cyan bg-lux-cyan/10 border border-lux-cyan/30 px-2 py-1 rounded-lg">
            Screenshot only
          </span>
        </div>

        <ol className="text-sm text-lux-muted space-y-1.5 list-decimal list-inside">
          <li>Open the profile link above</li>
          <li>
            Press <strong className="text-lux-text">Print Screen</strong> (or Win+Shift+S)
          </li>
          <li>
            Click the box below and press <strong className="text-lux-text">Ctrl+V</strong> to paste
          </li>
          <li>Generate InMail → copy → send on LinkedIn → mark complete</li>
        </ol>

        <div
          tabIndex={0}
          className="rounded-2xl border-2 border-dashed border-lux-cyan/35 bg-lux-cyan/[0.04] min-h-[160px] flex items-center justify-center p-4 outline-none focus:border-lux-cyan"
        >
          {imageDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageDataUrl} alt="Profile screenshot" className="max-h-56 rounded-xl border border-white/10" />
          ) : (
            <p className="text-sm text-lux-muted text-center">
              Click here, then <strong className="text-lux-cyan">Ctrl+V</strong> to paste screenshot
            </p>
          )}
        </div>

        {imageDataUrl && (
          <button
            type="button"
            className="text-xs text-lux-muted hover:text-lux-cyan"
            onClick={() => setImageDataUrl(null)}
          >
            Clear screenshot
          </button>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-semibold">
            {error}
          </div>
        )}

        <Button variant="lux-cyan" className="w-full" disabled={generating || !imageDataUrl} onClick={generate}>
          {generating ? "Reading profile & writing InMail…" : "✦ Generate personalized InMail"}
        </Button>

        {(subject || body) && (
          <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Subject</p>
                <button type="button" className="text-xs text-lux-cyan hover:underline" onClick={() => copyText("subject")}>
                  {copied === "subject" ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-lux-text font-medium">{subject}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">InMail body</p>
                <button type="button" className="text-xs text-lux-cyan hover:underline" onClick={() => copyText("body")}>
                  {copied === "body" ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-sm text-lux-muted whitespace-pre-wrap font-sans leading-relaxed">{body}</pre>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="lux-soft" size="sm" onClick={() => copyText("both")}>
                {copied === "both" ? "Copied both!" : "Copy subject + body"}
              </Button>
              <Button variant="lux-success" size="sm" disabled={completing} onClick={markComplete}>
                {completing ? "Saving…" : "Sent — mark complete"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
