"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LiveChatPanel from "@/components/team/LiveChatPanel";
import type { LiveChatMessage, LiveChatThread } from "@/lib/live-chat";
import { cn } from "@/lib/utils";

type Mode = "member" | "leader";

export default function LiveChatWidget({ mode }: { mode: Mode }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);

  const [thread, setThread] = useState<LiveChatThread | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [memberLoading, setMemberLoading] = useState(true);

  const [threads, setThreads] = useState<LiveChatThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leaderMessages, setLeaderMessages] = useState<LiveChatMessage[]>([]);

  const leaderSnapshot = useRef<string>("");

  const refreshMember = useCallback(async () => {
    const res = await fetch("/api/team/live-chat");
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.thread);
    setMessages(data.messages || []);
    setMemberLoading(false);
  }, []);

  const refreshLeaderThreads = useCallback(async () => {
    const res = await fetch("/api/team/leader/live-chat");
    if (!res.ok) return;
    const data = await res.json();
    const list = (data.threads || []) as LiveChatThread[];
    setThreads(list);

    const snapshot = list
      .map((t) => `${t.id}:${t.last_message_at}:${t.assigned_leaders?.length ?? 0}`)
      .join("|");
    const prev = leaderSnapshot.current;
    if (prev && prev !== snapshot && !open) {
      const newest = list[0];
      if (newest?.member?.name) {
        setToast(`Live chat — ${newest.member.name} needs help`);
        setUnread((n) => n + 1);
      }
    }
    leaderSnapshot.current = snapshot;

    setSelectedId((prev) => {
      if (prev && list.some((t) => t.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, [open]);

  const loadLeaderMessages = useCallback(async (threadId: string) => {
    const res = await fetch(`/api/team/leader/live-chat/${threadId}`);
    if (!res.ok) return;
    const data = await res.json();
    setLeaderMessages(data.messages || []);
  }, []);

  const refreshLeaderChat = useCallback(async () => {
    await refreshLeaderThreads();
    if (selectedId) await loadLeaderMessages(selectedId);
  }, [refreshLeaderThreads, loadLeaderMessages, selectedId]);

  function openWidget() {
    setOpen(true);
    setToast(null);
    setUnread(0);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleOpen = () => openWidget();
    window.addEventListener("inmailly:open-live-chat", handleOpen);
    return () => window.removeEventListener("inmailly:open-live-chat", handleOpen);
  }, []);

  useEffect(() => {
    if (mode !== "leader") return;
    refreshLeaderThreads();
    const id = setInterval(refreshLeaderThreads, 5000);
    return () => clearInterval(id);
  }, [mode, refreshLeaderThreads]);

  useEffect(() => {
    if (mode === "member") refreshMember();
  }, [mode, refreshMember]);

  useEffect(() => {
    if (mode !== "leader" || !selectedId) {
      setLeaderMessages([]);
      return;
    }
    loadLeaderMessages(selectedId);
  }, [mode, selectedId, loadLeaderMessages]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 12000);
    return () => clearTimeout(id);
  }, [toast]);

  async function sendMember(body: string) {
    const res = await fetch("/api/team/live-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return false;
    await refreshMember();
    return true;
  }

  async function sendLeader(body: string) {
    if (!selectedId) return false;
    const res = await fetch("/api/team/leader/live-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: selectedId, body }),
    });
    if (!res.ok) return false;
    await refreshLeaderChat();
    return true;
  }

  const assigned = thread?.assigned_leaders?.length ?? 0;
  const selected = threads.find((t) => t.id === selectedId) ?? null;

  if (!mounted) return null;

  const ui = (
    <>
      {toast && !open && (
        <button
          type="button"
          onClick={openWidget}
          className="fixed bottom-[5.5rem] right-5 z-[9999] max-w-[min(100vw-2.5rem,320px)] lux-card-elite px-4 py-3 border-lux-cyan/40 shadow-[0_8px_32px_rgba(34,211,238,0.2)] text-left"
        >
          <p className="text-sm font-semibold text-lux-cyan">{toast}</p>
          <p className="text-xs text-lux-muted mt-0.5">Tap to open live chat</p>
        </button>
      )}

      {open && (
        <div
          className="fixed bottom-[5.5rem] right-5 z-[9999] w-[min(calc(100vw-2rem),380px)] lux-card-elite border-lux-violet/30 shadow-[0_12px_48px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          role="dialog"
          aria-label="Live chat"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-lux-violet/10 to-lux-cyan/5">
            <div>
              <p className="text-sm font-semibold text-white">
                {mode === "member" ? "Team support" : "Live chat inbox"}
              </p>
              <p className="text-[0.65rem] text-lux-muted">Private · team only</p>
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

          {mode === "member" && (
            <>
              {!memberLoading && assigned === 0 && (
                <div className="px-4 py-2.5 border-b border-amber-500/25 bg-amber-500/10 flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                  </span>
                  <span className="text-xs text-amber-100 font-medium">Locating team leader…</span>
                </div>
              )}
              {!memberLoading && assigned > 0 && (
                <div className="px-4 py-2 border-b border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-200">
                  Connected with {thread?.assigned_leaders?.map((l) => l.name).join(", ")}
                </div>
              )}
              {memberLoading ? (
                <p className="text-sm text-lux-muted p-6 text-center">Opening chat…</p>
              ) : (
                <LiveChatPanel
                  compact
                  messages={messages}
                  onSend={sendMember}
                  onRefresh={refreshMember}
                  disabled={thread?.status !== "open"}
                  emptyHint="Describe your issue — we are finding a team leader for you."
                />
              )}
            </>
          )}

          {mode === "leader" && (
            <>
              {threads.length === 0 ? (
                <p className="text-sm text-lux-muted p-6 text-center">
                  No chats assigned yet. Admin will route member requests to you.
                </p>
              ) : (
                <>
                  <div className="flex gap-1 p-2 border-b border-white/[0.06] overflow-x-auto lux-scrollbar-hide">
                    {threads.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        className={cn(
                          "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          t.id === selectedId
                            ? "bg-amber-500/20 text-amber-100 border border-amber-500/30"
                            : "text-lux-muted hover:bg-white/[0.05]"
                        )}
                      >
                        {t.member?.name || "Member"}
                      </button>
                    ))}
                  </div>
                  <LiveChatPanel
                    compact
                    messages={leaderMessages}
                    onSend={sendLeader}
                    onRefresh={refreshLeaderChat}
                    ownSenderTypes={["leader"]}
                    disabled={!selected || selected.status !== "open"}
                    placeholder="Reply to member…"
                    emptyHint="Member is waiting — say hello."
                  />
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-[9999]">
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openWidget())}
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center text-xl",
            "bg-gradient-to-br from-lux-cyan to-lux-violet text-white",
            "shadow-[0_4px_24px_rgba(34,211,238,0.45)] ring-2 ring-lux-cyan/40",
            "hover:scale-105 active:scale-95 transition-transform"
          )}
          aria-label={open ? "Close live chat" : "Open live chat"}
          title="Live chat (team only)"
        >
          💬
          {unread > 0 && !open && (
            <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[0.65rem] font-bold border-2 border-lux-bg">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </>
  );

  return createPortal(ui, document.body);
}
