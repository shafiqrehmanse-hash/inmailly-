"use client";

import { useCallback, useEffect, useState } from "react";
import LiveChatPanel from "@/components/team/LiveChatPanel";
import Badge from "@/components/ui/Badge";
import type { LiveChatMessage, LiveChatThread } from "@/lib/live-chat";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function LeaderLiveChatInbox() {
  const [threads, setThreads] = useState<LiveChatThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadThreads = useCallback(async () => {
    const res = await fetch("/api/team/leader/live-chat");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not load inbox");
      return;
    }
    const data = await res.json();
    const list = (data.threads || []) as LiveChatThread[];
    setThreads(list);
    setError("");
    setSelectedId((prev) => {
      if (prev && list.some((t) => t.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    const res = await fetch(`/api/team/leader/live-chat/${threadId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    loadThreads().finally(() => setLoading(false));
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  const refreshChat = useCallback(async () => {
    await loadThreads();
    if (selectedId) await loadMessages(selectedId);
  }, [loadThreads, loadMessages, selectedId]);

  async function send(body: string) {
    if (!selectedId) return false;
    const res = await fetch("/api/team/leader/live-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: selectedId, body }),
    });
    if (!res.ok) return false;
    await refreshChat();
    return true;
  }

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  if (loading) {
    return <p className="text-sm text-lux-muted">Loading inbox…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-400">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Live chat inbox</h1>
        <p className="text-sm text-lux-muted mt-1">
          Chats assigned to you by admin. You only see threads you have been granted access to.
        </p>
      </div>

      {threads.length === 0 ? (
        <div className="lux-card-elite p-8 text-center border-lux-violet/20">
          <p className="text-lux-muted text-sm">No chats assigned yet.</p>
          <p className="text-xs text-lux-muted mt-2">Admin will assign outreach member threads to you when ready.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[480px]">
          <div className="lux-card-elite border-lux-violet/20 overflow-hidden flex flex-col">
            <div className="px-3 py-2.5 border-b border-white/[0.06] text-xs font-semibold uppercase tracking-wide text-lux-muted">
              Assigned ({threads.length})
            </div>
            <div className="flex-1 overflow-y-auto lux-scrollbar-hide">
              {threads.map((t) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b border-white/[0.04] transition-colors",
                      active ? "bg-amber-500/10 border-l-2 border-l-amber-400" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="text-sm font-medium text-lux-text truncate">{t.member?.name || "Member"}</div>
                    <div className="text-xs text-lux-muted truncate mt-0.5">{t.last_message || "No messages yet"}</div>
                    <div className="text-[0.58rem] text-lux-muted mt-1">{formatRelative(t.last_message_at)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            {selected && (
              <div className="lux-card-elite p-3 border-lux-violet/20 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-lux-text">{selected.member?.name}</span>
                <Badge variant={selected.status === "open" ? "available" : "general"}>{selected.status}</Badge>
                <span className="text-xs text-lux-muted ml-auto">{selected.member?.email}</span>
              </div>
            )}
            <LiveChatPanel
              messages={messages}
              onSend={send}
              onRefresh={refreshChat}
              ownSenderTypes={["leader"]}
              disabled={!selected || selected.status !== "open"}
              placeholder="Reply to member…"
              emptyHint="No messages in this thread yet."
            />
          </div>
        </div>
      )}
    </div>
  );
}
