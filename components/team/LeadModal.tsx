"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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
  memberId,
  memberName,
  lead,
  prefill,
  onSaved,
  isAdmin,
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
}) {
  const supabase = createClient();
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
    const { data, error } = await supabase
      .from("leads")
      .insert({
        member_id: memberId,
        name: form.name.trim(),
        profile_url: form.profile_url || null,
        company: form.company || null,
        position: form.position || null,
        email: form.email || null,
        phone: form.phone || null,
        notes: form.notes || null,
        status: form.status,
        source_link_id: (form as LeadForm & { source_link_id?: string }).source_link_id || null,
      })
      .select()
      .single();
    setLoading(false);
    if (!error && data) {
      setCurrentLead(data as Lead);
      onSaved?.();
      onClose();
    }
  }

  async function handleUpdateLead(updates: Partial<Lead>) {
    if (!currentLead) return;
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
    const { data } = await supabase
      .from("lead_messages")
      .insert({
        lead_id: currentLead.id,
        sender: msgSender,
        sender_name: msgSender === "team" ? memberName : currentLead.name,
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
            <label className="text-xs text-dimmer uppercase tracking-wide">Status</label>
            <select
              className="input-field mt-1"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Lead["status"] })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-card">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-dimmer uppercase tracking-wide">Notes</label>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <Button onClick={handleAddLead} disabled={loading} className="w-full">
            {loading ? "Saving…" : "Add Lead"}
          </Button>
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
            {!isAdmin && (
              <select
                className="input-field text-sm py-1.5 ml-auto w-auto"
                value={currentLead.status}
                onChange={(e) =>
                  handleUpdateLead({ status: e.target.value as Lead["status"] })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-card">
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <h3 className="font-bricolage font-bold mb-3">Conversation</h3>
            <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
              {messages.length === 0 && (
                <p className="text-sm text-dimmer">No messages yet.</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="bg-off rounded-xl p-3 border border-line">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={msg.msg_type === "inmail" ? "linkedin" : "new"}>
                      {msg.msg_type}
                    </Badge>
                    <span className="text-xs text-mid">{msg.sender_name}</span>
                    <span className="text-xs text-dimmer ml-auto">
                      {formatDate(msg.created_at)}
                    </span>
                    {msg.sender === "team" && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="text-xs text-red-500/70 hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-ink whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-line pt-4">
              <textarea
                className="input-field min-h-[80px]"
                placeholder="Add a message…"
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
              />
              <div className="flex flex-wrap gap-3">
                <select
                  className="input-field w-auto text-sm py-2"
                  value={msgType}
                  onChange={(e) => setMsgType(e.target.value as LeadMessage["msg_type"])}
                >
                  {MSG_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-card">
                      {t}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-xl overflow-hidden border border-line2">
                  {(["team", "lead"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setMsgSender(s)}
                      className={`px-4 py-2 text-sm capitalize ${
                        msgSender === s ? "bg-ind/10 text-ind font-semibold" : "text-dimmer hover:text-mid"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Button onClick={handleAddMessage} className="ml-auto">
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
      <label className="text-xs text-dimmer uppercase tracking-wide">{label}</label>
      <input
        className="input-field mt-1"
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
      <div className="text-xs text-dimmer">{label}</div>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-ind text-sm truncate block hover:underline">
          {value}
        </a>
      ) : (
        <div className="text-sm">{value}</div>
      )}
    </div>
  );
}
