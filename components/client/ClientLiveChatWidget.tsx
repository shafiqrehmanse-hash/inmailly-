"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import LiveChatPanel from "@/components/team/LiveChatPanel";
import type { LiveChatMessage } from "@/lib/live-chat";
import { cn } from "@/lib/utils";

const PANEL_SHELL =
  "!fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-lux-card/95 to-lux-bg2/90 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.55)] inset-x-4 bottom-[5.5rem] max-h-[min(72vh,560px)] sm:inset-x-auto sm:right-6 sm:left-auto sm:bottom-24 sm:w-[min(100vw-3rem,400px)]";

export default function ClientLiveChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/client/live-chat");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Chat is not available yet");
      setLoading(false);
      return;
    }
    setError("");
    setMessages(data.messages || []);
    setStatus(data.thread?.status === "closed" ? "closed" : "open");
    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function send(body: string) {
    const res = await fetch("/api/client/live-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return false;
    await refresh();
    return true;
  }

  if (!mounted) return null;

  const ui = (
    <div className="pointer-events-none">
      {open && (
        <button
          type="button"
          aria-label="Close chat backdrop"
          className="!fixed inset-0 z-[9998] bg-black/40 pointer-events-auto sm:bg-transparent sm:pointer-events-none"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div className={cn(PANEL_SHELL, "pointer-events-auto min-h-[320px]")} role="dialog" aria-label="Live chat">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-lux-violet/10 to-lux-cyan/5 shrink-0">
            <div>
              <p className="text-sm font-bold text-emerald-400">Chat with InMailly</p>
              <p className="text-[0.65rem] text-emerald-600/90 font-semibold">Questions, changes, anything — we get an email</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg text-lux-muted hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          {error ? (
            <p className="text-sm text-amber-200 p-6 text-center flex-1">{error}</p>
          ) : loading ? (
            <p className="text-sm text-lux-muted p-6 text-center flex-1">Opening chat…</p>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <LiveChatPanel
                compact
                messages={messages}
                onSend={send}
                onRefresh={refresh}
                ownSenderTypes={["client"]}
                disabled={status !== "open"}
                placeholder="Ask anything…"
                emptyHint="Send a message — we’ll see it in email and reply here."
              />
            </div>
          )}
        </div>
      )}

      <div className="!fixed z-[9999] bottom-5 right-5 sm:bottom-6 sm:right-6 pointer-events-auto">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center text-xl",
            "bg-gradient-to-br from-lux-cyan to-lux-violet text-white",
            "shadow-[0_4px_24px_rgba(34,211,238,0.45)] ring-2 ring-lux-cyan/40",
            "hover:scale-105 active:scale-95 transition-transform"
          )}
          aria-label="Open live chat"
          title="Chat with InMailly"
        >
          💬
        </button>
      </div>
    </div>
  );

  return createPortal(ui, document.body);
}
