"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import TeamBroadcastComposer from "@/components/team/TeamBroadcastComposer";
import type { TeamTask } from "@/lib/types";

type InviteCode = {
  id: string;
  code: string;
  label: string | null;
  uses_left: number;
  used_count: number;
  created_at: string;
};

export default function LeaderWorkspace({ leaderName }: { leaderName: string }) {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [inviteLabel, setInviteLabel] = useState("");
  const [inviteUses, setInviteUses] = useState(25);
  const [generatedCode, setGeneratedCode] = useState("");
  const [sendEmail, setSendEmail] = useState("");
  const [sendCode, setSendCode] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [toast, setToast] = useState("");
  const [siteOrigin, setSiteOrigin] = useState("");
  const [tab, setTab] = useState<"tasks" | "invites" | "email">("tasks");

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    const [tasksRes, codesRes] = await Promise.all([
      fetch("/api/team/leader/tasks"),
      fetch("/api/team/leader/invite-codes"),
    ]);
    const tasksData = await tasksRes.json();
    const codesData = await codesRes.json();
    setTasks(tasksData.tasks || []);
    setCodes(codesData.codes || []);
    if (!sendCode && codesData.codes?.[0]?.code) {
      setSendCode(codesData.codes[0].code);
    }
  }, [sendCode]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function generateCode() {
    if (!inviteLabel.trim()) {
      flash("Enter a label first");
      return;
    }
    const res = await fetch("/api/team/leader/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: inviteLabel, uses: inviteUses }),
    });
    const data = await res.json();
    if (data.error) flash(data.error);
    else {
      setGeneratedCode(data.code?.code || "");
      setSendCode(data.code?.code || "");
      flash("Invite code created");
      load();
    }
  }

  async function sendInviteEmail() {
    const res = await fetch("/api/team/leader/invite-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sendEmail, inviteCode: sendCode, note: sendNote }),
    });
    const data = await res.json();
    if (data.error) flash(data.error);
    else {
      flash(data.skipped ? "Email skipped (not configured)" : `Invite sent to ${data.sentTo}`);
      setSendEmail("");
      setSendNote("");
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    await fetch("/api/team/leader/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status }),
    });
    load();
  }

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In progress" },
    { value: "done", label: "Done" },
  ];

  return (
    <div className="space-y-8">
      {toast && (
        <div className="lux-toast-anchor" role="status">
          <div className="lux-toast-success text-center">{toast}</div>
        </div>
      )}

      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Leader workspace</h1>
        <p className="text-sm text-lux-muted mt-1">
          Tasks, invite codes, and custom emails to your team — with your name in the signature.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "tasks" as const, label: "My tasks" },
            { id: "invites" as const, label: "Invites" },
            { id: "email" as const, label: "Email team" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`lux-tab-pill ${tab === t.id ? "lux-tab-pill-active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "email" && (
        <TeamBroadcastComposer mode="leader" leaderName={leaderName} />
      )}

      {tab === "tasks" && (
        <section className="space-y-4">
          <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-violet/80">My tasks</h2>
          {tasks.length === 0 ? (
            <div className="lux-card-elite p-6 text-sm text-lux-muted">No tasks assigned yet.</div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="lux-card-elite p-4 flex flex-wrap items-start gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-lux-text">{t.title}</div>
                    {t.description && <p className="text-sm text-lux-muted mt-1">{t.description}</p>}
                    {t.due_at && (
                      <p className="text-[0.68rem] text-lux-muted mt-2">Due {new Date(t.due_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <LuxSelect
                    size="sm"
                    className="min-w-[140px]"
                    value={t.status}
                    onChange={(status) => updateTaskStatus(t.id, status)}
                    options={statusOptions}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "invites" && (
        <>
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="lux-card-elite p-5 space-y-3">
              <h2 className="font-bricolage font-bold text-lux-text">Generate invite code</h2>
              <p className="text-xs text-lux-muted -mt-1">For /team/register — share or email below</p>
              <input
                className="lux-input"
                placeholder="Batch label (e.g. March recruits)"
                value={inviteLabel}
                onChange={(e) => setInviteLabel(e.target.value)}
              />
              <input
                className="lux-input"
                type="number"
                min={1}
                value={inviteUses}
                onChange={(e) => setInviteUses(parseInt(e.target.value) || 1)}
              />
              <Button variant="lux-cyan" className="w-full" onClick={generateCode}>
                Generate code
              </Button>
              {generatedCode && (
                <div className="bg-lux-cyan/10 border border-lux-cyan/30 px-4 py-3 text-center rounded-xl">
                  <p className="text-[0.65rem] uppercase tracking-wide text-lux-muted mb-1">New code</p>
                  <p className="font-mono font-bold text-lux-cyan text-lg">{generatedCode}</p>
                  <p className="text-[0.65rem] text-lux-muted mt-2">
                    {siteOrigin}/team/register?code={generatedCode}
                  </p>
                </div>
              )}
            </div>

            <div className="lux-card-elite p-5 space-y-3">
              <h2 className="font-bricolage font-bold text-lux-text">Email invite</h2>
              <p className="text-xs text-lux-muted -mt-1">Sends dark branded invite with code + signup link</p>
              <input
                className="lux-input"
                type="email"
                placeholder="Recipient email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
              />
              <LuxSelect
                value={sendCode}
                onChange={setSendCode}
                options={
                  codes.length
                    ? codes.map((c) => ({
                        value: c.code,
                        label: `${c.code} · ${c.uses_left} left`,
                      }))
                    : [{ value: "", label: "Generate a code first" }]
                }
              />
              <textarea
                className="lux-input min-h-[72px]"
                placeholder="Personal note (optional)"
                value={sendNote}
                onChange={(e) => setSendNote(e.target.value)}
              />
              <Button variant="lux" className="w-full" onClick={sendInviteEmail} disabled={!sendEmail || !sendCode}>
                Send invite email
              </Button>
            </div>
          </section>

          {codes.length > 0 && (
            <section>
              <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-lux-cyan/80 mb-3">Your codes</h2>
              <div className="lux-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-lux-muted text-xs uppercase border-b border-white/[0.06]">
                      <th className="text-left px-4 py-3">Code</th>
                      <th className="text-left px-4 py-3">Label</th>
                      <th className="text-left px-4 py-3">Uses left</th>
                      <th className="text-left px-4 py-3">Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((c) => (
                      <tr key={c.id} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-4 py-3 font-mono text-lux-cyan">{c.code}</td>
                        <td className="px-4 py-3 text-lux-muted">{c.label || "—"}</td>
                        <td className="px-4 py-3">{c.uses_left}</td>
                        <td className="px-4 py-3">{c.used_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
