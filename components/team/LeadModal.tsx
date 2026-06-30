"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import Modal from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadMessage } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const MSG_TYPES = ["message", "followup", "reply", "inmail", "note"] as const;
const STATUSES = [
  "new",
  "contacted",
  "replied",
  "interested",
  "not_interested",
  "follow_up",
  "closed",
  "dead",
] as const;

type LeadForm = {
  name: string;
  profile_url: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  notes: string;
  status: Lead["status"];
  source_link_id?: string;
};

export default function LeadModal({
  open,
  onClose,
  mode,
  memberId: _memberId,
  memberName,
  lead,
  prefill,
  onSaved,
  isAdmin,
  adminKey,
}: {
  open: boolean;
  onClose: () => void;
  mode: "add" | "view";
  memberId: string;
  memberName: string;
  lead?: Lead | null;
  prefill?: { name?: string; url?: string; source_link_id?: string };
  onSaved?: () => void;
  isAdmin?: boolean;
  adminKey?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  void _memberId;
  const [form, setForm] = useState<LeadForm>({
    name: "",
    profile_url: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    notes: "",
    status: "new",
  });
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [msgContent, setMsgContent] = useState("");
  const [msgType, setMsgType] = useState<LeadMessage["msg_type"]>("message");
  const [msgSender, setMsgSender] = useState<"team" | "lead">("team");
  const [currentLead, setCurrentLead] = useState<Lead | null>(lead ?? null);

  useEffect(() => {
    if (mode === "add" && prefill) {
      setForm((f) => ({
        ...f,
        name: prefill.name || f.name,
        profile_url: prefill.url || f.profile_url,
        source_link_id: prefill.source_link_id,
      }));
    }
  }, [mode, prefill]);

  useEffect(() => {
    if (lead) setCurrentLead(lead);
  }, [lead]);

  useEffect(() => {
    if (!open || !currentLead) return;
    loadMessages(currentLead.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentLead?.id]);

  async function loadMessages(leadId: string) {
    if (adminKey) {
      const res = await fetch(`/api/admin/leads/messages?key=${adminKey}&leadId=${leadId}`);
      const data = await res.json();
      setMessages((data.messages as LeadMessage[]) || []);
      return;
    }
    const { data } = await supabase
      .from("lead_messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });
    setMessages((data as LeadMessage[]) || []);
  }

  async function handleAddLead() {
    if (!form.name.trim()) return;
    setLoading(true);
    setSaveError(null);

    const res = await fetch("/api/team/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        profile_url: form.profile_url || null,
        company: form.company || null,
        position: form.position || null,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
        status: form.status,
        source_link_id: (form as LeadForm & { source_link_id?: string }).source_link_id || null,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setSaveError(data.error || "Could not save lead");
      return;
    }
    if (data.lead) {
      setCurrentLead(data.lead as Lead);
      onSaved?.();
      onClose();
    }
  }

  async function handleUpdateLead(updates: Partial<Lead>) {
    if (!currentLead) return;
    if (adminKey) {
      const res = await fetch(`/api/admin/leads?key=${adminKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: currentLead.id, ...updates }),
      });
      const data = await res.json();
      if (data.lead) {
        setCurrentLead(data.lead as Lead);
        onSaved?.();
      }
      return;
    }
    const { data } = await supabase
      .from("leads")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", currentLead.id)
      .select()
      .single();
    if (data) {
      setCurrentLead(data as Lead);
      onSaved?.();
    }
  }

  async function handleAddMessage() {
    if (!currentLead || !msgContent.trim()) return;
    const displayName = isAdmin ? `Admin → ${memberName}` : memberName;

    if (adminKey) {
      const res = await fetch(`/api/admin/leads/messages?key=${adminKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: currentLead.id,
          sender: msgSender,
          sender_name: msgSender === "team" ? displayName : currentLead.name,
          msg_type: msgType,
          content: msgContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((m) => [...m, data.message as LeadMessage]);
        setMsgContent("");
        onSaved?.();
      }
      return;
    }

    const { data } = await supabase
      .from("lead_messages")
      .insert({
        lead_id: currentLead.id,
        sender: msgSender,
        sender_name: msgSender === "team" ? (isAdmin ? `Admin → ${memberName}` : memberName) : currentLead.name,
        msg_type: msgType,
        content: msgContent.trim(),
      })
      .select()
      .single();
    if (data) {
      setMessages((m) => [...m, data as LeadMessage]);
      setMsgContent("");
      if (msgSender === "lead" && currentLead.status === "contacted") {
        await handleUpdateLead({ status: "replied" });
      }
    }
  }

  async function handleDeleteMessage(msgId: string) {
    await supabase.from("lead_messages").delete().eq("id", msgId);
    setMessages((m) => m.filter((x) => x.id !== msgId));
  }

  async function toggleDealClosed() {
    if (!currentLead) return;
    const closed = !currentLead.deal_closed;
    await handleUpdateLead({
      deal_closed: closed,
      closed_at: closed ? new Date().toISOString() : null,
      status: closed ? "closed" : currentLead.status,
    });
  }

  const viewMode = mode === "view" || currentLead;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={viewMode ? currentLead?.name || "Lead" : "Add Lead"}
      wide
    >
      {!viewMode ? (
        <div className="space-y-4">
          <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Profile URL" value={form.profile_url} onChange={(v) => setForm({ ...form, profile_url: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field label="Position" value={form.position} onChange={(v) => setForm({ ...form, position: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          </div>
          <div>
            <label className="text-xs text-lux-muted uppercase tracking-wide">Status</label>
            <LuxSelect
              className="mt-1"
              value={form.status}
              onChange={(status) => setForm({ ...form, status: status as Lead["status"] })}
              options={STATUSES.map((s) => ({
                value: s,
                label: s.replace(/_/g, " "),
              }))}
            />
          </div>
          <div>
            <label className="text-xs text-lux-muted uppercase tracking-wide">Notes</label>
            <textarea
              className="lux-input mt-1 min-h-[80px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button variant="lux" onClick={handleAddLead} disabled={loading} className="w-full">
            {loading ? "Saving…" : "Add Lead"}
          </Button>
          {saveError && <p className="text-sm text-red-400">{saveError}</p>}
        </div>
      ) : currentLead ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Company" value={currentLead.company} />
            <Info label="Position" value={currentLead.position} />
            <Info label="Email" value={currentLead.email} />
            <Info label="Phone" value={currentLead.phone} />
            <div className="col-span-2">
              <Info label="Profile" value={currentLead.profile_url} link />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={currentLead.status}>{currentLead.status}</Badge>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={currentLead.deal_closed}
                onChange={toggleDealClosed}
                className="rounded"
              />
              Deal closed
            </label>
            {isAdmin && adminKey ? (
              <LuxSelect
                className="ml-auto w-40"
                size="sm"
                value={currentLead.status}
                onChange={(status) => handleUpdateLead({ status: status as Lead["status"] })}
                options={STATUSES.map((s) => ({
                  value: s,
                  label: s.replace(/_/g, " "),
                }))}
              />
            ) : !isAdmin ? (
              <LuxSelect
                className="ml-auto w-40"
                size="sm"
                value={currentLead.status}
                onChange={(status) =>
                  handleUpdateLead({ status: status as Lead["status"] })
                }
                options={STATUSES.map((s) => ({
                  value: s,
                  label: s.replace(/_/g, " "),
                }))}
              />
            ) : null}
          </div>

          <div>
            <h3 className="font-bricolage font-bold mb-3 text-lux-text">Conversation</h3>
            <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
              {messages.length === 0 && (
                <p className="text-sm text-lux-muted">No messages yet.</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={msg.msg_type === "inmail" ? "linkedin" : "new"}>
                      {msg.msg_type}
                    </Badge>
                    <span className="text-xs text-lux-muted">{msg.sender_name}</span>
                    <span className="text-xs text-lux-muted/70 ml-auto">
                      {formatDate(msg.created_at)}
                    </span>
                    {msg.sender === "team" && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-xs text-red-400/70 hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-lux-text whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-white/[0.08] pt-4">
              <textarea
                className="lux-input min-h-[80px]"
                placeholder="Add a message…"
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <LuxSelect
                  className="w-36"
                  size="sm"
                  value={msgType}
                  onChange={(t) => setMsgType(t as LeadMessage["msg_type"])}
                  options={MSG_TYPES.map((t) => ({ value: t, label: t }))}
                />
                <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
                  {(["team", "lead"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setMsgSender(s)}
                      className={`px-4 py-2 text-sm capitalize ${
                        msgSender === s
                          ? "bg-lux-cyan/15 text-lux-cyan font-semibold"
                          : "text-lux-muted hover:text-lux-text"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Button variant="lux" onClick={handleAddMessage} className="ml-auto">
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-lux-muted uppercase tracking-wide">{label}</label>
      <input
        className="lux-input mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Info({
  label,
  value,
  link,
}: {
  label: string;
  value: string | null;
  link?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-lux-muted">{label}</div>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-lux-cyan text-sm truncate block hover:underline">
          {value}
        </a>
      ) : (
        <div className="text-sm text-lux-text">{value}</div>
      )}
    </div>
  );
}
