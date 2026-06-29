"use client";

import { useCallback, useEffect, useState } from "react";
import type { ScriptPayload } from "@/lib/scripts";
import { cn } from "@/lib/utils";

const PICKER_OPTIONS = [
  {
    key: "followup_accepted",
    color: "green",
    title: "After connection accepted",
    hint: "First message once they accept your request",
    icon: "🤝",
  },
  {
    key: "followup_learn_more",
    color: "purple",
    title: 'After "I would like to learn more"',
    hint: "Qualify their interest and offer a call",
    icon: "💬",
  },
  {
    key: "followup_pricing",
    color: "gold",
    title: "After someone asks pricing",
    hint: "Share pricing page and optional calendar link",
    icon: "💰",
  },
] as const;

export default function DailyScriptBar({
  scripts,
}: {
  scripts: Record<string, ScriptPayload>;
}) {
  const [active, setActive] = useState<ScriptPayload | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState("");

  const closeAll = useCallback(() => {
    setActive(null);
    setPickerOpen(false);
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
    setPickerOpen(false);
    setActive(s);
    document.body.style.overflow = "hidden";
  }

  async function copyText(text: string, label: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setToast(label);
      setTimeout(() => setToast(""), 2200);
    } catch {
      /* ignore */
    }
  }

  const pct = active?.pct ?? 0;

  return (
    <>
      <div
        className="sticky top-0 z-40 bg-lux-bg2/95 backdrop-blur-md border-b border-white/[0.08]"
        role="region"
        aria-label="Daily outreach scripts"
      >
        <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan mr-1">
            Daily scripts
          </span>
          <ScriptBtn
            icon="📝"
            label="Add Note"
            sub="Connection request"
            className="from-blue-600/35 to-blue-600/15 border-blue-400/35"
            onClick={() => openScript("add_note")}
          />
          <ScriptBtn
            icon="📨"
            label="InMail"
            sub="Direct message"
            className="from-amber-500/40 to-amber-700/20 border-amber-300/40"
            onClick={() => openScript("inmail")}
          />
          <ScriptBtn
            icon="↩️"
            label="Follow-ups"
            sub="After they reply"
            className="from-ind2/40 to-ind/20 border-indigo-300/40"
            onClick={() => {
              setPickerOpen(true);
              document.body.style.overflow = "hidden";
            }}
          />
        </div>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[200] bg-ink/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeAll()}
        >
          <div className="w-full max-w-md bg-gradient-to-b from-ink2 to-[#1a1030] border border-green-500/25 rounded-[22px] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bricolage font-extrabold text-lg text-white">
                  Follow-up scripts
                </h2>
                <p className="text-sm text-white/70 mt-1">
                  Pick the situation — then copy the script to paste in LinkedIn.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="w-9 h-9 rounded-lg bg-white/10 text-white/60 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-2.5">
              {PICKER_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => openScript(opt.key)}
                  className={cn(
                    "w-full text-left rounded-xl border p-0 overflow-hidden transition-transform hover:-translate-y-0.5",
                    opt.color === "green" &&
                      "bg-gradient-to-br from-[#0d4a28] via-[#16803f] to-[#22a855] border-green-300/50",
                    opt.color === "purple" &&
                      "bg-gradient-to-br from-[#3b1f6e] via-[#5a3fa8] to-[#7857c8] border-violet-300/50",
                    opt.color === "gold" &&
                      "bg-gradient-to-br from-[#5c4200] via-[#a67c00] to-[#d4a017] border-amber-200/50"
                  )}
                >
                  <span className="flex items-center gap-3.5 p-4">
                    <span className="w-11 h-11 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-xl">
                      {opt.icon}
                    </span>
                    <span>
                      <strong className="block font-bricolage font-extrabold text-sm text-white">
                        {opt.title}
                      </strong>
                      <span className="block text-xs text-white/90 mt-0.5">{opt.hint}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {active && (
        <div
          className="fixed inset-0 z-[210] bg-ink/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeAll()}
        >
          <div
            className={cn(
              "relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border overflow-hidden shadow-2xl",
              active.tone === "inmail" && "bg-gradient-to-b from-[#1a1030] to-[#2d1f4e] border-violet-400/35",
              active.tone === "followup" && "bg-gradient-to-b from-[#12182a] to-[#1e2a45] border-blue-400/30",
              active.tone === "note" && "bg-gradient-to-b from-[#0f1a12] to-ink2 border-green-500/25"
            )}
          >
            <div className="p-5 pb-3 flex gap-3 items-start border-b border-white/10">
              <span className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl">
                {active.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-bricolage font-extrabold text-lg text-white">
                  {active.label} — Team copy
                </h2>
                <p className="text-xs text-white/45 mt-0.5">
                  {active.subtitle} · {active.badge}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="w-9 h-9 rounded-lg bg-white/10 text-white/60"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 px-5 py-3">
              {[
                { label: "Characters", value: active.length },
                { label: "Remaining", value: active.remaining },
                { label: "Of limit", value: `${active.pct}%` },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
                >
                  <div
                    className={cn(
                      "font-bricolage font-extrabold text-xl",
                      pct > 100 ? "text-red-400" : pct > 85 ? "text-amber-300" : "text-green-400"
                    )}
                  >
                    {s.value}
                  </div>
                  <div className="text-[0.62rem] font-bold uppercase tracking-wide text-white/35 mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-4 flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-auto bg-black/25 border border-white/10 rounded-xl p-4 max-h-72">
                {active.empty ? (
                  <p className="text-sm text-white/35 italic">
                    No script set yet. Ask admin to add today&apos;s copy in Team Admin → Scripts.
                  </p>
                ) : (
                  <p className="text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
                    {active.content}
                  </p>
                )}
              </div>
              <div className="h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pct > 100 ? "bg-red-500" : pct > 85 ? "bg-amber-400" : "bg-green-500"
                  )}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>

            <div className="p-5 pt-3 border-t border-white/10 bg-black/20 space-y-2">
              <div className={cn("grid gap-2", active.has_subject ? "grid-cols-2" : "grid-cols-1")}>
                {active.has_subject && active.subject && (
                  <button
                    type="button"
                    onClick={() => copyText(active.subject, "Subject copied")}
                    className="rounded-xl bg-gradient-to-br from-amber-600 to-amber-400 text-ink font-bold text-sm py-3 px-4"
                  >
                    Copy subject
                  </button>
                )}
                <button
                  type="button"
                  disabled={active.empty}
                  onClick={() =>
                    copyText(
                      active.has_subject && active.body ? active.body : active.content,
                      "Script copied — ready to paste"
                    )
                  }
                  className="rounded-xl bg-gradient-to-br from-green-700 to-green-500 text-white font-bold text-sm py-3 px-4 disabled:opacity-40"
                >
                  Copy script
                </button>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="w-full py-2.5 rounded-xl border border-white/15 text-white/55 text-xs font-semibold uppercase tracking-wide hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[220] bg-ink2 text-green-400 border border-green-500/40 px-5 py-3 rounded-full text-sm font-bold shadow-xl">
          {toast}
        </div>
      )}
    </>
  );
}

function ScriptBtn({
  icon,
  label,
  sub,
  className,
  onClick,
}: {
  icon: string;
  label: string;
  sub: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-[11px] border text-white font-bricolage font-extrabold text-[0.78rem] bg-gradient-to-br transition-transform hover:-translate-y-px",
        className
      )}
    >
      <span className="text-base">{icon}</span>
      <span className="text-left">
        {label}
        <span className="block font-sans font-semibold text-[0.58rem] opacity-75">{sub}</span>
      </span>
    </button>
  );
}
