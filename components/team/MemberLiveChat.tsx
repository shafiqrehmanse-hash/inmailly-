"use client";

import { useCallback, useEffect, useState } from "react";
import LiveChatPanel from "@/components/team/LiveChatPanel";
import Badge from "@/components/ui/Badge";
import type { LiveChatMessage, LiveChatThread } from "@/lib/live-chat";
import { formatRelative } from "@/lib/utils";

export default function MemberLiveChat() {
  const [thread, setThread] = useState<LiveChatThread | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/team/live-chat");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not load chat");
      return;
    }
    const data = await res.json();
    setThread(data.thread);
    setMessages(data.messages || []);
    setError("");
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  async function send(body: string) {
    const res = await fetch("/api/team/live-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return false;
    await refresh();
    return true;
  }

  if (loading) {
    return <p className="text-sm text-lux-muted">Loading chat…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-400">{error}</p>;
  }

  const assigned = thread?.assigned_leaders?.length ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Live chat</h1>
        <p className="text-sm text-lux-muted mt-1">
          Message your team leaders directly. An admin assigns leaders who can see and reply to your thread.
        </p>
      </div>

      <div className="lux-card-elite p-4 border-lux-violet/20 flex flex-wrap items-center gap-3 text-sm">
        <Badge variant={thread?.status === "open" ? "available" : "general"}>
          {thread?.status === "open" ? "Open" : "Closed"}
        </Badge>
        {assigned > 0 ? (
          <span className="text-lux-muted">
            Assigned:{" "}
            <span className="text-lux-text font-medium">
              {thread?.assigned_leaders?.map((l) => l.name).join(", ")}
            </span>
          </span>
        ) : (
          <span className="text-amber-400/90">Waiting for a leader to be assigned…</span>
        )}
        {thread?.last_message_at && (
          <span className="text-lux-muted ml-auto text-xs">
            Last activity {formatRelative(thread.last_message_at)}
          </span>
        )}
      </div>

      <LiveChatPanel
        messages={messages}
        onSend={send}
        onRefresh={refresh}
        disabled={thread?.status !== "open"}
        emptyHint="Say hello — your message goes to the team once a leader is assigned."
      />
    </div>
  );
}
