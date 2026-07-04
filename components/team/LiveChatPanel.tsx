"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import type { LiveChatMessage } from "@/lib/live-chat";
import { formatRelative } from "@/lib/utils";

type Props = {
  messages: LiveChatMessage[];
  onSend: (body: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  emptyHint?: string;
  /** Message sender types shown on the right (outgoing). */
  ownSenderTypes?: LiveChatMessage["sender_type"][];
  compact?: boolean;
};

export default function LiveChatPanel({
  messages,
  onSend,
  onRefresh,
  placeholder = "Type a message…",
  disabled,
  emptyHint = "Start the conversation — a team leader will reply once assigned.",
  ownSenderTypes = ["member"],
  compact,
}: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const id = setInterval(() => {
      onRefresh();
    }, 4000);
    return () => clearInterval(id);
  }, [onRefresh]);

  const send = useCallback(async () => {
    if (!text.trim() || sending || disabled) return;
    setSending(true);
    const ok = await onSend(text.trim());
    if (ok) setText("");
    setSending(false);
  }, [text, sending, disabled, onSend]);

  return (
    <div
      className={`flex flex-col overflow-hidden min-h-0 ${compact ? "flex-1 h-full min-h-[240px]" : "lux-card-elite h-[min(70vh,560px)] border-lux-violet/20"}`}
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-3 lux-scrollbar-hide">
        {messages.length === 0 && (
          <p className="text-sm text-lux-muted text-center py-8">{emptyHint}</p>
        )}
        {messages.map((m) => {
          const isSelf = ownSenderTypes.includes(m.sender_type);
          const isAdmin = m.sender_type === "admin";
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[85%] ${isSelf ? "ml-auto items-end" : "items-start"}`}
            >
              <div className="text-[0.62rem] mb-1 px-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-emerald-400">{m.sender_name}</span>
                {isAdmin && <span className="font-semibold text-amber-300">· Admin</span>}
                <span className="text-emerald-600/80">· {formatRelative(m.created_at)}</span>
              </div>
              <div
                className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isSelf
                    ? "bg-lux-cyan/20 border border-lux-cyan/30 text-white rounded-br-md"
                    : isAdmin
                      ? "bg-amber-500/15 border border-amber-500/25 text-white rounded-bl-md"
                      : "bg-lux-violet/15 border border-lux-violet/25 text-white rounded-bl-md"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-white/[0.06] flex gap-2">
        <input
          className="lux-input flex-1"
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          disabled={disabled || sending}
        />
        <Button variant="lux-cyan" onClick={send} disabled={disabled || sending || !text.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
