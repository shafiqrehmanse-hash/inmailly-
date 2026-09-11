"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { NAMED_LINK_FILE_ACCEPT, namedRowsToPaste, readNamedLinksFile } from "@/lib/named-link-file";
import { isOutreachWorker } from "@/lib/roles";
import { GROW_DAILY_USED_CAP } from "@/lib/grow-cap";
import type { TeamMember } from "@/lib/types";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";

type GrowMemberStat = {
  name: string;
  email: string;
  status: string;
  used_at: string | null;
};

type GrowProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  profile_url: string;
  batch_name: string | null;
  created_at: string;
  assigned_count: number;
  used_count: number;
  members: GrowMemberStat[];
};

export default function AdminGrowProfilesSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [paste, setPaste] = useState("");
  const [batchName, setBatchName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendToAll, setSendToAll] = useState(true);
  const [profiles, setProfiles] = useState<GrowProfileRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", "x-admin-key": adminKey }),
    [adminKey]
  );

  const activeMembers = members.filter((m) => m.is_active && isOutreachWorker(m.role));

  const load = useCallback(async () => {
    const [mRes, pRes] = await Promise.all([
      fetch(`/api/admin/members?key=${adminKey}`),
      fetch(`/api/admin/grow?key=${adminKey}`),
    ]);
    const mData = await mRes.json();
    const pData = await pRes.json();
    setMembers(mData.members || []);
    if (pData.error) showToast(pData.error, "error");
    setProfiles(pData.profiles || []);
    setLoading(false);
  }, [adminKey, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleMember(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onFile(file: File | null) {
    if (!file) return;
    try {
      const result = await readNamedLinksFile(file);
      if (!result.rows.length) {
        showToast("No first name / last name / LinkedIn URL rows found", "error");
        return;
      }
      setPaste(namedRowsToPaste(result.rows));
      showToast(`Loaded ${result.rows.length} profiles from ${result.fileName}`);
    } catch {
      showToast("Could not read that file", "error");
    }
  }

  async function sendFlow() {
    if (!paste.trim()) {
      showToast("Paste or upload profiles first", "error");
      return;
    }
    if (!sendToAll && selected.size === 0) {
      showToast("Select at least one active member", "error");
      return;
    }
    const who = sendToAll ? "all active outreach members" : `${selected.size} selected member(s)`;
    if (!confirm(`Send this grow flow to ${who}? They will get an email and the profiles on their dashboard.`)) {
      return;
    }
    setSending(true);
    const res = await fetch(`/api/admin/grow?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        paste,
        batch_name: batchName,
        send_to_all_active: sendToAll,
        member_ids: Array.from(selected),
      }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      showToast(data.error || "Could not send", "error");
      return;
    }
    const skip = data.skippedCap?.length
      ? ` Skipped at daily cap: ${data.skippedCap.join(", ")}.`
      : "";
    showToast(
      `Sent ${data.profiles} profiles to ${data.members} members · emailed ${data.emailed}.${skip}`
    );
    setPaste("");
    load();
  }

  async function deleteProfile(p: GrowProfileRow) {
    if (!confirm(`Delete ${p.first_name} ${p.last_name} and all connection tracking on this profile?`)) return;
    const res = await fetch(`/api/admin/grow?key=${adminKey}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ profileId: p.id }),
    });
    const data = await res.json();
    if (!res.ok) showToast(data.error || "Delete failed", "error");
    else {
      showToast("Profile removed");
      load();
    }
  }

  const totalUsed = profiles.reduce((s, p) => s + p.used_count, 0);
  const totalAssigned = profiles.reduce((s, p) => s + p.assigned_count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Grow LinkedIn accounts</h1>
        <p className="text-sm text-lux-muted mt-1 max-w-2xl">
          Upload our own LinkedIn profiles. Selected active members get them on{" "}
          <strong className="text-lux-text">Grow accounts</strong>, plus an email. They send a
          connection request and mark used. Each profile shows how many teammates connected. Cap:{" "}
          <strong className="text-lux-cyan">{GROW_DAILY_USED_CAP} used per member per day</strong>.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Profiles", value: profiles.length },
          { label: "Assignments", value: totalAssigned },
          { label: "Connects marked", value: totalUsed },
          { label: "Daily cap", value: GROW_DAILY_USED_CAP },
        ].map((s) => (
          <div key={s.label} className="lux-card p-4 text-center">
            <div className="font-bricolage font-bold text-xl text-lux-cyan tabular-nums">{s.value}</div>
            <div className="text-[0.62rem] uppercase tracking-wide text-lux-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="lux-card p-5 space-y-4">
        <h2 className="font-bricolage font-bold text-lux-text">Send a flow</h2>
        <input
          className="lux-input"
          placeholder="Batch name (optional) — e.g. Founder profiles week 12"
          value={batchName}
          onChange={(e) => setBatchName(e.target.value)}
        />
        <textarea
          className="lux-input min-h-[160px] font-mono text-sm"
          placeholder={"FirstName,LastName,https://www.linkedin.com/in/...\nJane,Doe,https://www.linkedin.com/in/jane-doe"}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={NAMED_LINK_FILE_ACCEPT}
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
          />
          <Button type="button" variant="lux-ghost" size="sm" onClick={() => fileRef.current?.click()}>
            Upload CSV / Excel
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-lux-muted">
            <input type="radio" checked={sendToAll} onChange={() => setSendToAll(true)} />
            All active outreach members ({activeMembers.length})
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-lux-muted">
            <input type="radio" checked={!sendToAll} onChange={() => setSendToAll(false)} />
            Selected only
          </label>
        </div>

        {!sendToAll && (
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1">
            {activeMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMember(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  selected.has(m.id)
                    ? "bg-lux-cyan/15 text-lux-cyan border-lux-cyan/40"
                    : "text-lux-muted border-white/[0.08] hover:border-white/15"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        <Button variant="lux" onClick={sendFlow} disabled={sending} className="w-full">
          {sending ? "Sending…" : "Send to team + email"}
        </Button>
      </section>

      <section>
        <p className="admin-section-title mb-3">Profile analytics</p>
        {loading ? (
          <div className="lux-card px-4 py-10 text-center text-lux-muted">Loading…</div>
        ) : profiles.length === 0 ? (
          <div className="lux-card px-4 py-10 text-center text-lux-muted">
            No grow profiles yet. Upload a batch above.
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => {
              const open = openId === p.id;
              return (
                <article key={p.id} className="lux-card border border-white/[0.06] overflow-hidden">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <button type="button" className="text-left flex-1 min-w-0" onClick={() => setOpenId(open ? null : p.id)}>
                      <p className="font-semibold text-lux-text">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-lux-muted truncate">{p.profile_url}</p>
                      {p.batch_name && (
                        <p className="text-[0.62rem] text-amber-200/80 mt-1">{p.batch_name}</p>
                      )}
                    </button>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <div className="text-lg font-bold tabular-nums text-emerald-400">{p.used_count}</div>
                        <div className="text-[0.55rem] uppercase text-lux-muted">Connected</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold tabular-nums text-lux-cyan">{p.assigned_count}</div>
                        <div className="text-[0.55rem] uppercase text-lux-muted">Assigned</div>
                      </div>
                      <Button variant="lux-ghost" size="sm" onClick={() => deleteProfile(p)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  {open && (
                    <div className="px-4 pb-4 border-t border-white/[0.06] pt-3">
                      <a
                        href={p.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-lux-cyan hover:underline"
                      >
                        Open LinkedIn →
                      </a>
                      <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
                        {p.members.length === 0 ? (
                          <p className="text-sm text-lux-muted">Not sent to anyone yet.</p>
                        ) : (
                          p.members.map((m, i) => (
                            <div
                              key={`${m.email}-${i}`}
                              className="flex items-center justify-between gap-2 text-sm border-b border-white/[0.04] pb-1.5 last:border-0"
                            >
                              <span className="text-lux-text truncate">
                                {m.name}
                                <span className="text-lux-muted text-xs ml-2">{m.email}</span>
                              </span>
                              <span
                                className={
                                  m.status === "used"
                                    ? "text-[0.62rem] font-bold uppercase text-emerald-400"
                                    : "text-[0.62rem] uppercase text-lux-muted"
                                }
                              >
                                {m.status === "used" ? "Connected" : "Pending"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
