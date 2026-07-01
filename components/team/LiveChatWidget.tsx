"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LiveChatPanel from "@/components/team/LiveChatPanel";
import type { LiveChatMessage, LiveChatThread } from "@/lib/live-chat";
import { cn } from "@/lib/utils";

type Mode = "member" | "leader";

const PANEL_SHELL =
  "!fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-lux-card/95 to-lux-bg2/90 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.55)] inset-x-4 bottom-[5.5rem] max-h-[min(72vh,560px)] sm:inset-x-auto sm:right-6 sm:left-auto sm:bottom-24 sm:w-[min(100vw-3rem,400px)]";

export default function LiveChatWidget({
  mode,
  agentEnabled = true,
}: {
  mode: Mode;
  agentEnabled?: boolean;
}) {
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
  const openRef = useRef(false);
  openRef.current = open;

  const refreshMember = useCallback(async () => {
    const res = await fetch("/api/team/live-chat");
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.thread);
    setMessages(data.messages || []);
    setMemberLoading(false);
  }, []);

  const refreshLeaderThreads = useCallback(async () => {
    if (!agentEnabled) return;
    const res = await fetch("/api/team/leader/live-chat");
    if (!res.ok) return;
    const data = await res.json();
    const list = (data.threads || []) as LiveChatThread[];
    setThreads(list);

    const snapshot = list
      .map((t) => `${t.id}:${t.last_message_at}:${t.assigned_leaders?.length ?? 0}`)
      .join("|");
    const prev = leaderSnapshot.current;
    if (prev && prev !== snapshot && !openRef.current) {
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
  }, [agentEnabled]);

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
    try {
      sessionStorage.setItem("inmailly-live-chat-open", "1");
    } catch {
      /* ignore */
    }
  }

  function closeWidget() {
    setOpen(false);
    try {
      sessionStorage.removeItem("inmailly-live-chat-open");
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem("inmailly-live-chat-open") === "1") {
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => openWidget();
    window.addEventListener("inmailly:open-live-chat", handleOpen);
    return () => window.removeEventListener("inmailly:open-live-chat", handleOpen);
  }, []);

  useEffect(() => {
    if (mode !== "leader" || !agentEnabled) return;
    refreshLeaderThreads();
    const id = setInterval(refreshLeaderThreads, 5000);
    return () => clearInterval(id);
  }, [mode, agentEnabled, refreshLeaderThreads]);

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
    <div className="pointer-events-none">
      {open && (
        <button
          type="button"
          aria-label="Close chat backdrop"
          className="!fixed inset-0 z-[9998] bg-black/40 pointer-events-auto sm:bg-transparent sm:pointer-events-none"
          onClick={closeWidget}
        />
      )}

      {toast && !open && (
        <button
          type="button"
          onClick={openWidget}
          className={cn(PANEL_SHELL, "pointer-events-auto h-auto p-4 border-lux-cyan/40 text-left")}
        >
          <p className="text-sm font-semibold text-lux-cyan">{toast}</p>
          <p className="text-xs text-lux-muted mt-0.5">Tap to open live chat</p>
        </button>
      )}

      {open && (
        <div className={cn(PANEL_SHELL, "pointer-events-auto min-h-[320px]")} role="dialog" aria-label="Live chat">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-lux-violet/10 to-lux-cyan/5 shrink-0">
            <div>
              <p className="text-sm font-semibold text-white">
                {mode === "member" ? "Team support" : "Live chat inbox"}
              </p>
              <p className="text-[0.65rem] text-lux-muted">Private · team only</p>
            </div>
            <button
              type="button"
              onClick={closeWidget}
              className="w-8 h-8 rounded-lg text-lux-muted hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {mode === "member" && (
            <>
              {!memberLoading && assigned === 0 && (
                <div className="px-4 py-2.5 border-b border-amber-500/25 bg-amber-500/10 flex items-center gap-2.5 shrink-0">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                  </span>
                  <span className="text-xs text-amber-100 font-medium">Locating team leader…</span>
                  <span className="text-[0.65rem] text-amber-200/80 ml-auto">Auto-assigns when you send</span>
                </div>
              )}
              {!memberLoading && assigned > 0 && (
                <div className="px-4 py-2 border-b border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-200 shrink-0">
                  Connected with {thread?.assigned_leaders?.map((l) => l.name).join(", ")}
                </div>
              )}
              {memberLoading ? (
                <p className="text-sm text-lux-muted p-6 text-center flex-1">Opening chat…</p>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col">
                  <LiveChatPanel
                    compact
                    messages={messages}
                    onSend={sendMember}
                    onRefresh={refreshMember}
                    disabled={thread?.status !== "open"}
                    emptyHint="Describe your issue — we are finding a team leader for you."
                  />
                </div>
              )}
            </>
          )}

          {mode === "leader" && (
            <>
              {!agentEnabled ? (
                <div className="p-6 text-center space-y-2 flex-1">
                  <p className="text-sm text-amber-200 font-medium">Chat agent access not enabled yet</p>
                  <p className="text-xs text-lux-muted leading-relaxed">
                    Ask admin to open <strong className="text-lux-text">Admin → Live chat</strong> and check your
                    name under <strong className="text-lux-text">Chat agents</strong>.
                  </p>
                </div>
              ) : threads.length === 0 ? (
                <div className="p-6 text-center flex-1 flex flex-col justify-center gap-2">
                  <p className="text-sm text-lux-text font-medium">Waiting for member chat</p>
                  <p className="text-xs text-lux-muted leading-relaxed">
                    New outreach chats auto-assign to you when a member sends a message. If none appear,
                    confirm admin enabled you under <strong className="text-lux-text">Chat agents</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 p-2 border-b border-white/[0.06] overflow-x-auto lux-scrollbar-hide shrink-0">
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
                  <div className="flex-1 min-h-0 flex flex-col">
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
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      <div className="!fixed z-[9999] bottom-5 right-5 sm:bottom-6 sm:right-6 pointer-events-auto">
        <button
          type="button"
          onClick={openWidget}
          className={cn(
            "relative w-14 h-14 rounded-full flex items-center justify-center text-xl",
            "bg-gradient-to-br from-lux-cyan to-lux-violet text-white",
            "shadow-[0_4px_24px_rgba(34,211,238,0.45)] ring-2 ring-lux-cyan/40",
            "hover:scale-105 active:scale-95 transition-transform"
          )}
          aria-label="Open live chat"
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
    </div>
  );

  return createPortal(ui, document.body);
}
