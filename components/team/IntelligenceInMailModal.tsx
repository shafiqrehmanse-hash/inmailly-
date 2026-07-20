"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { displayLinkName } from "@/lib/links";
import type { OutreachLink } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_DATA_URL_CHARS = 5_500_000;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

/** Shrink huge Print Screens so they still fit the API limit. */
async function normalizeScreenshot(dataUrl: string): Promise<string> {
  if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not process screenshot"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      let out = canvas.toDataURL("image/jpeg", quality);
      while (out.length > MAX_DATA_URL_CHARS && quality > 0.45) {
        quality -= 0.1;
        out = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error("Invalid screenshot image"));
    img.src = dataUrl;
  });
}

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
  const [dragOver, setDragOver] = useState(false);
  const [pasteFlash, setPasteFlash] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setImageDataUrl(null);
    setError("");
    setSubject(link?.generated_subject || "");
    setBody(link?.generated_body || "");
    setCopied(null);
    setDragOver(false);
    // Focus paste zone so Ctrl+V works immediately after opening
    const t = window.setTimeout(() => dropRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, link]);

  const acceptImage = useCallback(async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("That wasn’t an image. Use Print Screen → Ctrl+V, or upload a PNG/JPG.");
      return;
    }
    try {
      const raw = await fileToDataUrl(file);
      const normalized = await normalizeScreenshot(raw);
      if (!normalized.startsWith("data:image/")) {
        setError("Could not read that screenshot. Try again.");
        return;
      }
      setImageDataUrl(normalized);
      setError("");
      setPasteFlash(true);
      window.setTimeout(() => setPasteFlash(false), 900);
    } catch {
      setError("Could not process screenshot — try a smaller crop (Win+Shift+S).");
    }
  }, []);

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        e.preventDefault();
        acceptImage(item.getAsFile());
        return;
      }
      // Some browsers put image as file in clipboardData.files
      const files = e.clipboardData?.files;
      if (files?.length) {
        const img = Array.from(files).find((f) => f.type.startsWith("image/"));
        if (img) {
          e.preventDefault();
          acceptImage(img);
        }
      }
    },
    [acceptImage]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, onPaste]);

  async function generate() {
    if (!link || !imageDataUrl) {
      setError("Paste or upload a Print Screen of the LinkedIn profile first.");
      dropRef.current?.focus();
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
  const hasDraft = Boolean(subject || body);
  const step = !imageDataUrl ? 1 : !hasDraft ? 2 : 3;

  return (
    <Modal open={open} onClose={onClose} title="✦ Paste screenshot → InMail" wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
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
          <div className="flex gap-1.5 flex-wrap">
            {[
              { n: 1, label: "Screenshot" },
              { n: 2, label: "Generate" },
              { n: 3, label: "Send" },
            ].map((s) => (
              <span
                key={s.n}
                className={cn(
                  "text-[0.58rem] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                  step >= s.n
                    ? "text-lux-cyan bg-lux-cyan/10 border-lux-cyan/35"
                    : "text-lux-muted border-white/10"
                )}
              >
                {s.n}. {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-lux-muted leading-relaxed">
          <strong className="text-lux-text">Fast path:</strong> Open profile →{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-lux-text text-xs">Win+Shift+S</kbd> crop the
          profile → come back here →{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-lux-text text-xs">Ctrl+V</kbd> paste. Or upload /
          drag a PNG/JPG below.
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            acceptImage(file);
            e.target.value = "";
          }}
        />

        <div
          ref={dropRef}
          tabIndex={0}
          role="button"
          aria-label="Paste or drop LinkedIn profile screenshot"
          onClick={() => dropRef.current?.focus()}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0] || null;
            acceptImage(file);
          }}
          className={cn(
            "rounded-2xl border-2 border-dashed min-h-[200px] flex flex-col items-center justify-center gap-3 p-5 outline-none transition-all cursor-pointer",
            pasteFlash
              ? "border-emerald-400/60 bg-emerald-500/10"
              : dragOver
                ? "border-lux-cyan bg-lux-cyan/15 scale-[1.01]"
                : imageDataUrl
                  ? "border-lux-cyan/40 bg-lux-cyan/[0.06]"
                  : "border-lux-cyan/35 bg-lux-cyan/[0.04] focus:border-lux-cyan focus:ring-2 focus:ring-lux-cyan/20"
          )}
        >
          {imageDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageDataUrl}
                alt="Profile screenshot"
                className="max-h-64 w-auto max-w-full rounded-xl border border-white/10 shadow-lg"
              />
              <p className="text-xs text-emerald-300 font-semibold">
                {pasteFlash ? "Screenshot captured ✓" : "Screenshot ready — generate below"}
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-lux-cyan/15 border border-lux-cyan/30 flex items-center justify-center text-2xl">
                📋
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-bricolage font-bold text-lux-text">
                  Paste screenshot here
                </p>
                <p className="text-sm text-lux-muted">
                  Click this box, then press{" "}
                  <strong className="text-lux-cyan">Ctrl+V</strong>
                </p>
                <p className="text-xs text-lux-muted/80">or drag & drop an image · or upload a file</p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="lux-soft"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload screenshot
          </Button>
          {imageDataUrl && (
            <Button
              variant="lux-ghost"
              size="sm"
              onClick={() => {
                setImageDataUrl(null);
                setError("");
                dropRef.current?.focus();
              }}
            >
              Clear & paste again
            </Button>
          )}
          <Button
            variant="lux-ghost"
            size="sm"
            onClick={() => {
              window.open(link.url, "_blank", "noopener,noreferrer");
              dropRef.current?.focus();
            }}
          >
            Open profile ↗
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-semibold">
            {error}
          </div>
        )}

        <Button
          variant="lux-cyan"
          className="w-full h-11 text-base"
          disabled={generating || !imageDataUrl}
          onClick={generate}
        >
          {generating ? "Reading screenshot & writing InMail…" : "✦ Generate personalized InMail"}
        </Button>

        {(subject || body) && (
          <div className="space-y-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-emerald-300">
              Ready to send on LinkedIn
            </p>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Subject</p>
                <button
                  type="button"
                  className="text-xs text-lux-cyan hover:underline"
                  onClick={() => copyText("subject")}
                >
                  {copied === "subject" ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-lux-text font-medium">{subject}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">InMail body</p>
                <button
                  type="button"
                  className="text-xs text-lux-cyan hover:underline"
                  onClick={() => copyText("body")}
                >
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
