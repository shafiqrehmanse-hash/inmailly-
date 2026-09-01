"use client";

import { useCallback, useEffect, useState } from "react";
import LiveChatPanel from "@/components/team/LiveChatPanel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import type { LiveChatMessage } from "@/lib/live-chat";
import { useAdminKey } from "@/lib/admin-context";
import { formatRelative } from "@/lib/utils";

type ClientThread = {
  id: string;
  status: "open" | "closed";
  last_message_at: string;
  last_message?: string | null;
  clients?: { name: string; email: string | null; company_name: string | null } | null;
};

export default function AdminClientLiveChatSection() {
  const adminKey = useAdminKey();
  const [threads, setThreads] = useState<ClientThread[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [loadError, setLoadError] = useState("");

  const loadThreads = useCallback(async () => {
    const res = await fetch(`/api/admin/clients/live-chat?key=${adminKey}&status=${statusFilter}`);
    const data = await res.json();
    if (!res.ok) {
      setLoadError(data.error || "Could not load chats");
      return;
    }
    setLoadError("");
    const list = (data.threads || []) as ClientThread[];
    setThreads(list);
    setSelectedId((prev) => {
      if (prev && list.some((t) => t.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, [adminKey, statusFilter]);

  const loadMessages = useCallback(
    async (threadId: string) => {
      const res = await fetch(`/api/admin/clients/live-chat/${threadId}?key=${adminKey}`);
      const data = await res.json();
      setMessages(data.messages || []);
    },
    [adminKey]
  );

  useEffect(() => {
    loadThreads();
    const id = setInterval(loadThreads, 8000);
    return () => clearInterval(id);
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
    const res = await fetch(`/api/admin/clients/live-chat/${selectedId}?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return false;
    await refreshChat();
    return true;
  }

  async function closeThread() {
    if (!selectedId) return;
    await fetch(`/api/admin/clients/live-chat?key=${adminKey}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ threadId: selectedId, status: "closed" }),
    });
    await loadThreads();
  }

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Client live chat</h1>
        <p className="text-sm text-lux-muted mt-1">
          Every client message also emails you. Reply here — they see it in the portal chat bubble and get an email.
        </p>
      </div>

      <LuxSelect
        className="w-40"
        size="sm"
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { value: "open", label: "Open" },
          { value: "closed", label: "Closed" },
          { value: "all", label: "All" },
        ]}
      />

      {loadError && (
        <div className="lux-card p-4 text-sm text-amber-200 border-amber-500/30">
          {loadError}
          {loadError.includes("schema") || loadError.includes("does not exist")
            ? " Run supabase/migrations/034_client_live_chat.sql in Supabase SQL editor."
            : ""}
        </div>
      )}

      {threads.length === 0 && !loadError ? (
        <div className="lux-card px-4 py-12 text-center text-lux-muted">No client chats yet.</div>
      ) : (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          <div className="lux-card overflow-hidden p-0">
            <div className="max-h-[70vh] overflow-y-auto">
              {threads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.06] hover:bg-white/[0.03] ${
                    t.id === selectedId ? "bg-lux-cyan/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-lux-text text-sm truncate">
                      {t.clients?.name || "Client"}
                    </span>
                    <Badge variant={t.status === "open" ? "interested" : "dead"}>{t.status}</Badge>
                  </div>
                  <p className="text-[0.65rem] text-lux-muted truncate mt-0.5">{t.clients?.email}</p>
                  {t.last_message && (
                    <p className="text-xs text-lux-muted line-clamp-2 mt-1">{t.last_message}</p>
                  )}
                  <p className="text-[0.6rem] text-lux-muted mt-1">{formatRelative(t.last_message_at)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            {selected && (
              <>
                <div className="lux-card-elite p-4 border-lux-violet/20 flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-lux-text">{selected.clients?.name}</p>
                    <p className="text-xs text-lux-muted">
                      {selected.clients?.email}
                      {selected.clients?.company_name ? ` · ${selected.clients.company_name}` : ""}
                    </p>
                  </div>
                  {selected.status === "open" && (
                    <Button variant="lux-ghost" size="sm" onClick={closeThread}>
                      Close thread
                    </Button>
                  )}
                </div>
                <LiveChatPanel
                  messages={messages}
                  onSend={send}
                  onRefresh={refreshChat}
                  ownSenderTypes={["admin"]}
                  disabled={selected.status !== "open"}
                  placeholder="Reply to client…"
                  emptyHint="No messages yet."
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
