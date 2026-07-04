"use client";

import { useCallback, useEffect, useState } from "react";
import LiveChatPanel from "@/components/team/LiveChatPanel";
import OnlineDot from "@/components/team/OnlineDot";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import type { LiveChatMessage, LiveChatThread } from "@/lib/live-chat";
import { useAdminKey } from "@/lib/admin-context";
import { cn, formatRelative } from "@/lib/utils";

type ChatLeader = {
  id: string;
  name: string;
  email: string;
  live_chat_agent: boolean;
  is_active: boolean;
};

export default function AdminLiveChatSection() {
  const adminKey = useAdminKey();
  const [leaders, setLeaders] = useState<ChatLeader[]>([]);
  const [threads, setThreads] = useState<LiveChatThread[]>([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [assignIds, setAssignIds] = useState<string[]>([]);
  const [savingAssign, setSavingAssign] = useState(false);
  const [toast, setToast] = useState("");

  const hdr = { "x-admin-key": adminKey };

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadLeaders = useCallback(async () => {
    const res = await fetch(`/api/admin/live-chat/agents?key=${adminKey}`);
    const data = await res.json();
    setLeaders(data.leaders || []);
  }, [adminKey]);

  const loadThreads = useCallback(async () => {
    const res = await fetch(`/api/admin/live-chat/threads?key=${adminKey}&status=${statusFilter}`);
    const data = await res.json();
    const list = (data.threads || []) as LiveChatThread[];
    setThreads(list);
    setSelectedId((prev) => {
      if (prev && list.some((t) => t.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, [adminKey, statusFilter]);

  const loadMessages = useCallback(
    async (threadId: string) => {
      const res = await fetch(`/api/admin/live-chat/threads/${threadId}/messages?key=${adminKey}`);
      const data = await res.json();
      setMessages(data.messages || []);
    },
    [adminKey]
  );

  useEffect(() => {
    loadLeaders();
  }, [loadLeaders]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setAssignIds([]);
      return;
    }
    loadMessages(selectedId);
    const t = threads.find((x) => x.id === selectedId);
    setAssignIds(t?.assigned_leaders?.map((l) => l.id) || []);
  }, [selectedId, loadMessages, threads]);

  const refreshChat = useCallback(async () => {
    await loadThreads();
    if (selectedId) await loadMessages(selectedId);
  }, [loadThreads, loadMessages, selectedId]);

  async function toggleAgent(leaderId: string, enabled: boolean) {
    const res = await fetch(`/api/admin/live-chat/agents?key=${adminKey}`, {
      method: "PATCH",
      headers: { ...hdr, "Content-Type": "application/json" },
      body: JSON.stringify({ leaderId, liveChatAgent: enabled }),
    });
    if (!res.ok) {
      flash("Could not update agent access");
      return;
    }
    await loadLeaders();
    flash(enabled ? "Live chat access granted" : "Live chat access revoked");
  }

  async function saveAssignment() {
    if (!selectedId) return;
    setSavingAssign(true);
    const res = await fetch(`/api/admin/live-chat/threads/${selectedId}/assign?key=${adminKey}`, {
      method: "POST",
      headers: { ...hdr, "Content-Type": "application/json" },
      body: JSON.stringify({ leaderIds: assignIds }),
    });
    setSavingAssign(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      flash(data.error || "Assignment failed");
      return;
    }
    await loadThreads();
    flash("Leaders assigned");
  }

  async function closeThread() {
    if (!selectedId) return;
    const res = await fetch(`/api/admin/live-chat/threads/${selectedId}/assign?key=${adminKey}`, {
      method: "PATCH",
      headers: { ...hdr, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    if (!res.ok) {
      flash("Could not close thread");
      return;
    }
    await loadThreads();
    flash("Thread closed");
  }

  async function send(body: string) {
    if (!selectedId) return false;
    const res = await fetch(`/api/admin/live-chat/threads?key=${adminKey}`, {
      method: "POST",
      headers: { ...hdr, "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: selectedId, body }),
    });
    if (!res.ok) return false;
    await refreshChat();
    return true;
  }

  const selected = threads.find((t) => t.id === selectedId) ?? null;
  const agentLeaders = leaders.filter((l) => l.is_active && l.live_chat_agent);

  function toggleAssignLeader(id: string) {
    setAssignIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 lux-card px-4 py-2 text-sm text-lux-cyan border-lux-cyan/30">
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Live chat</h1>
        <p className="text-sm text-lux-muted mt-1">
          Grant team leaders chat access. Member messages auto-assign to the least-busy agent — you can
          reassign or add more leaders anytime.
        </p>
      </div>

      <div className="lux-card-elite p-4 border-lux-violet/20 space-y-3">
        <h2 className="text-sm font-semibold text-lux-text">Chat agents (team leaders)</h2>
        <p className="text-xs text-lux-muted">
          Only leaders with access can be assigned to threads. Revoking access does not remove past assignments.
        </p>
        <div className="space-y-2">
          {leaders.length === 0 && <p className="text-sm text-lux-muted">No team leaders found.</p>}
          {leaders.map((l) => (
            <label
              key={l.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                l.live_chat_agent ? "border-amber-500/30 bg-amber-500/5" : "border-white/[0.06] hover:bg-white/[0.02]"
              )}
            >
              <input
                type="checkbox"
                checked={l.live_chat_agent}
                disabled={!l.is_active}
                onChange={(e) => toggleAgent(l.id, e.target.checked)}
                className="accent-amber-400"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-emerald-400">{l.name}</div>
                <div className="text-xs text-emerald-600/80 truncate font-semibold">{l.email}</div>
              </div>
              {!l.is_active && <Badge variant="general">Inactive</Badge>}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LuxSelect
          className="w-36"
          size="sm"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
            { value: "all", label: "All" },
          ]}
        />
        <span className="text-xs text-lux-muted">{threads.length} thread(s)</span>
      </div>

      {threads.length === 0 ? (
        <div className="lux-card-elite p-8 text-center border-lux-violet/20 text-sm text-lux-muted">
          No {statusFilter === "all" ? "" : statusFilter} chat threads yet.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4">
          <div className="lux-card-elite border-lux-violet/20 overflow-hidden flex flex-col max-h-[640px]">
            <div className="px-3 py-2.5 border-b border-white/[0.06] text-xs font-semibold uppercase tracking-wide text-lux-muted">
              Threads
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
                      active ? "bg-lux-cyan/10 border-l-2 border-l-lux-cyan" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <OnlineDot online={t.member?.is_online} />
                      <span className="text-sm font-bold text-emerald-400 truncate">{t.member?.name}</span>
                      <Badge variant={t.status === "open" ? "available" : "general"}>{t.status}</Badge>
                    </div>
                    <div className="text-xs text-emerald-600/80 truncate mt-0.5 font-medium">{t.last_message || "—"}</div>
                    <div className="text-[0.58rem] text-emerald-500/80 mt-1 font-semibold">
                      {t.assigned_leaders?.length
                        ? `Assigned: ${t.assigned_leaders.map((l) => l.name).join(", ")}`
                        : "Unassigned"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            {selected && (
              <>
                <div className="lux-card-elite p-4 border-lux-violet/20 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <OnlineDot online={selected.member?.is_online} />
                    <span className="font-bold text-emerald-400">{selected.member?.name}</span>
                    <span className="text-xs font-semibold text-emerald-600/90">{selected.member?.email}</span>
                    <span className="text-xs text-emerald-600/70 ml-auto font-semibold">
                      {selected.member?.is_online ? "Online" : "Offline"} · {formatRelative(selected.last_message_at)}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-lux-muted uppercase tracking-wide mb-2">
                      Assign leaders
                    </p>
                    {agentLeaders.length === 0 ? (
                      <p className="text-xs text-amber-400">Grant chat access to at least one leader above.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {agentLeaders.map((l) => (
                          <label
                            key={l.id}
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer",
                              assignIds.includes(l.id)
                                ? "border-lux-cyan/40 bg-lux-cyan/10 text-lux-text"
                                : "border-white/10 text-lux-muted hover:border-white/20"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={assignIds.includes(l.id)}
                              onChange={() => toggleAssignLeader(l.id)}
                              className="accent-lux-cyan"
                            />
                            {l.name}
                          </label>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button variant="lux-cyan" size="sm" onClick={saveAssignment} disabled={savingAssign}>
                        Save assignment
                      </Button>
                      {selected.status === "open" && (
                        <Button variant="ghost" size="sm" onClick={closeThread}>
                          Close thread
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <LiveChatPanel
                  messages={messages}
                  onSend={send}
                  onRefresh={refreshChat}
                  ownSenderTypes={["admin"]}
                  disabled={selected.status !== "open"}
                  placeholder="Reply as admin…"
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
