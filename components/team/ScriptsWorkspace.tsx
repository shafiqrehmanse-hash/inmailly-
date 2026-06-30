"use client";

import { useState } from "react";
import type { ScriptPayload } from "@/lib/scripts";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { cn } from "@/lib/utils";

export default function ScriptsWorkspace({ scripts }: { scripts: ScriptPayload[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  async function copyOnly(text: string, successMsg: string) {
    if (!text?.trim()) return;
    const ok = await copyToClipboard(text.trim());
    setToast(ok ? successMsg : "Copy failed — tap the text and copy manually");
    setTimeout(() => setToast(""), 2400);
  }

  function toggle(key: string) {
    setOpenKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl lux-gradient-text">📋 Scripts</h1>
        <p className="text-lux-muted text-sm mt-1">
          Tap a script to expand — copy subject and message separately. More scripts can be added here later.
        </p>
      </div>

      <div className="space-y-3">
        {scripts.map((script) => (
          <ScriptAccordionCard
            key={script.key}
            script={script}
            open={openKey === script.key}
            onToggle={() => toggle(script.key)}
            onCopy={copyOnly}
          />
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] lux-toast-success select-none">
          {toast}
        </div>
      )}
    </div>
  );
}

function ScriptAccordionCard({
  script,
  open,
  onToggle,
  onCopy,
}: {
  script: ScriptPayload;
  open: boolean;
  onToggle: () => void;
  onCopy: (text: string, msg: string) => void;
}) {
  const messageText =
    script.tone === "inmail"
      ? script.body
      : script.has_subject && script.body
        ? script.body
        : script.body || script.content;

  const toneBorder =
    script.tone === "inmail"
      ? "border-lux-violet/25 hover:border-lux-violet/40"
      : "border-lux-cyan/20 hover:border-lux-cyan/35";

  const toneAccent =
    script.tone === "inmail"
      ? "from-lux-violet/12 to-lux-blue/5"
      : "from-lux-cyan/10 to-lux-blue/5";

  return (
    <div
      className={cn(
        "lux-card-elite overflow-hidden transition-all duration-300",
        open && "shadow-[0_0_40px_rgba(139,92,246,0.08)]",
        toneBorder
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 sm:p-5 text-left transition-colors select-none",
          open && `bg-gradient-to-r ${toneAccent}`
        )}
        aria-expanded={open}
      >
        <span className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-xl shrink-0">
          {script.icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bricolage font-extrabold text-lux-text">{script.label}</span>
          <span className="block text-xs text-lux-muted mt-0.5 truncate">
            {script.subtitle} · {script.badge}
          </span>
        </span>
        <span
          className={cn(
            "w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-lux-muted transition-transform duration-300",
            open && "rotate-180 border-lux-violet/30 text-lux-violet"
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 sm:px-5 pb-5 pt-0 space-y-3 border-t border-white/[0.06]">
            {script.empty ? (
              <p className="text-sm text-lux-muted italic py-6 text-center">
                No script set yet. Admin can add copy in Admin → Team → Daily scripts.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 pt-4">
                  {[
                    { label: "Characters", value: script.length },
                    { label: "Remaining", value: script.remaining },
                    { label: "Of limit", value: `${script.pct}%` },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-lux-bg2/50 border border-white/[0.06] rounded-xl p-2.5 text-center"
                    >
                      <div
                        className={cn(
                          "font-bricolage font-extrabold text-lg tabular-nums",
                          script.pct > 100
                            ? "text-red-400"
                            : script.pct > 85
                              ? "text-amber-300"
                              : "text-lux-cyan"
                        )}
                      >
                        {s.value}
                      </div>
                      <div className="text-[0.55rem] font-bold uppercase tracking-wide text-lux-muted mt-0.5">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {script.has_subject && script.subject && (
                  <CopyBox
                    label="Subject"
                    text={script.subject}
                    onCopy={() => onCopy(script.subject, "Subject copied")}
                  />
                )}
                <CopyBox
                  label={script.tone === "inmail" ? "Message" : "Script"}
                  text={messageText}
                  onCopy={() => onCopy(messageText, "Message copied — ready to paste")}
                  tall
                />

                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 bg-gradient-to-r",
                      script.pct > 100
                        ? "from-red-600 to-red-400"
                        : script.pct > 85
                          ? "from-amber-600 to-amber-400"
                          : "from-lux-violet to-lux-cyan"
                    )}
                    style={{ width: `${Math.min(100, script.pct)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
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
    <div className="rounded-xl border border-lux-violet/20 bg-lux-bg2/40 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06] bg-lux-violet/[0.05]">
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
          "p-4 text-sm text-lux-text/90 whitespace-pre-wrap leading-relaxed select-text cursor-text lux-scrollbar-hide",
          tall ? "max-h-64 overflow-y-auto" : "max-h-28 overflow-y-auto"
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
