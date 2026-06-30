"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScriptPayload } from "@/lib/scripts";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/utils";

export default function SidebarScripts({
  scripts,
}: {
  scripts: Record<string, ScriptPayload>;
}) {
  const [active, setActive] = useState<ScriptPayload | null>(null);
  const [toast, setToast] = useState("");

  const closeAll = useCallback(() => {
    setActive(null);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeAll]);

  function openScript(key: string) {
    const s = scripts[key];
    if (!s) return;
    setActive(s);
    document.body.style.overflow = "hidden";
  }

  async function copyOnly(text: string, successMsg: string) {
    if (!text?.trim()) return;
    const ok = await copyToClipboard(text.trim());
    setToast(ok ? successMsg : "Copy failed — tap the text and copy manually");
    setTimeout(() => setToast(""), 2400);
  }

  const pct = active?.pct ?? 0;
  const scriptText =
    active?.tone === "inmail"
      ? active.body || ""
      : active?.has_subject && active.body
        ? active.body
        : active?.content || "";

  return (
    <>
      <div className="mx-2 mb-3 px-1">
        <div className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-lux-violet/80 px-2 py-2">
          Scripts
        </div>
        <div className="space-y-1.5">
          <SidebarScriptBtn
            icon="📝"
            label="Add Note"
            sub="Connection request"
            tone="note"
            onClick={() => openScript("add_note")}
          />
          <SidebarScriptBtn
            icon="📨"
            label="InMail"
            sub="Subject + message"
            tone="inmail"
            onClick={() => openScript("inmail")}
          />
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeAll()}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
          <div className="relative lux-modal-panel w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up">
            <ModalHeader
              icon={active.icon}
              title={active.label}
              subtitle={`${active.subtitle} · ${active.badge}`}
              onClose={closeAll}
            />

            <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-white/[0.06]">
              {[
                { label: "Characters", value: active.length },
                { label: "Remaining", value: active.remaining },
                { label: "Of limit", value: `${active.pct}%` },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-lux-bg2/60 border border-white/[0.06] rounded-xl p-3 text-center"
                >
                  <div
                    className={cn(
                      "font-bricolage font-extrabold text-xl tabular-nums",
                      pct > 100 ? "text-red-400" : pct > 85 ? "text-amber-300" : "text-lux-cyan"
                    )}
                  >
                    {s.value}
                  </div>
                  <div className="text-[0.58rem] font-bold uppercase tracking-wide text-lux-muted mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
              {active.empty ? (
                <p className="text-sm text-lux-muted italic text-center py-8">
                  No script set yet. Admin can add copy in Admin → Team → Daily scripts.
                </p>
              ) : (
                <>
                  {active.has_subject && active.subject && (
                    <CopyBox
                      label="Subject"
                      text={active.subject}
                      onCopy={() => copyOnly(active.subject, "Subject copied")}
                    />
                  )}
                  <CopyBox
                    label={active.tone === "inmail" ? "Message" : "Script"}
                    text={scriptText}
                    onCopy={() => copyOnly(scriptText, "Message copied — ready to paste")}
                    tall
                  />
                </>
              )}

              {!active.empty && (
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all bg-gradient-to-r",
                      pct > 100
                        ? "from-red-600 to-red-400"
                        : pct > 85
                          ? "from-amber-600 to-amber-400"
                          : "from-lux-violet to-lux-cyan"
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              )}
            </div>

            <div className="p-5 pt-3 border-t border-white/[0.06] bg-lux-bg2/40">
              <button
                type="button"
                onClick={closeAll}
                className="w-full py-2.5 rounded-xl lux-btn-ghost text-[0.72rem]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] lux-toast-success select-none">
          {toast}
        </div>
      )}
    </>
  );
}

function ModalHeader({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="p-5 pb-4 flex gap-3 items-start border-b border-white/[0.06]">
      <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-lux-violet/25 to-lux-cyan/15 border border-lux-violet/25 flex items-center justify-center text-2xl shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <h2 className="font-bricolage font-extrabold text-lg text-lux-text">{title}</h2>
        <p className="text-xs text-lux-muted mt-0.5">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.05] text-lux-muted hover:text-lux-text hover:border-lux-violet/35 transition-colors select-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

function CopyBox({
  label,
  text,
  onCopy,
  tall,
}: {
  label: string;
  text: string;
  onCopy: () => void;
  tall?: boolean;
}) {
  return (
    <div className="rounded-xl border border-lux-violet/20 bg-lux-bg2/50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06] bg-lux-violet/[0.06]">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-lux-violet select-none">
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          onMouseDown={(e) => e.preventDefault()}
          className="lux-copy-btn select-none"
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          <CopyIcon />
          <span>Copy</span>
        </button>
      </div>
      <div
        className={cn(
          "p-4 text-sm text-lux-text/90 whitespace-pre-wrap leading-relaxed overflow-auto select-text cursor-text",
          tall ? "max-h-56" : "max-h-24"
        )}
      >
        {text}
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function SidebarScriptBtn({
  icon,
  label,
  sub,
  tone,
  onClick,
}: {
  icon: string;
  label: string;
  sub: string;
  tone: "note" | "inmail";
  onClick: () => void;
}) {
  const tones = {
    note: "border-lux-cyan/25 bg-gradient-to-r from-lux-cyan/10 to-lux-blue/5 hover:border-lux-cyan/40 hover:shadow-[0_0_16px_rgba(34,211,238,0.1)]",
    inmail:
      "border-lux-violet/30 bg-gradient-to-r from-lux-violet/14 to-lux-blue/6 hover:border-lux-violet/45 hover:shadow-[0_0_16px_rgba(139,92,246,0.12)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all hover:-translate-y-px select-none",
        tones[tone]
      )}
    >
      <span className="text-base shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block font-bricolage font-extrabold text-[0.78rem] text-white leading-tight">
          {label}
        </span>
        <span className="block text-[0.58rem] text-lux-muted truncate">{sub}</span>
      </span>
    </button>
  );
}
