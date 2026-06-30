"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  company_name: string | null;
  latest_project?: { id: string; name: string; status: string } | null;
};

export default function AdminClientEmailPanel({
  client,
  adminKey,
  onToast,
  onProjectUpdated,
}: {
  client: ClientRow;
  adminKey: string;
  onToast: (msg: string, type?: "success" | "error") => void;
  onProjectUpdated?: () => void;
}) {
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [open, setOpen] = useState(false);
  const [emailReady, setEmailReady] = useState<boolean | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const loadStatus = useCallback(async () => {
    const res = await fetch(`/api/admin/clients/email?key=${adminKey}`);
    const data = await res.json();
    if (res.ok) {
      setEmailReady(data.configured);
      setNotifyEmail(data.notifyEmail || "");
    }
  }, [adminKey]);

  useEffect(() => {
    if (open) loadStatus();
  }, [open, loadStatus]);

  async function send(action: "campaign_started" | "campaign_finished" | "custom") {
    if (action === "custom" && (!customSubject.trim() || customMessage.trim().length < 10)) {
      onToast("Add a subject and message (min 10 chars)", "error");
      return;
    }

    const label =
      action === "campaign_started"
        ? "Campaign started"
        : action === "campaign_finished"
          ? "Campaign finished"
          : "Custom email";

    if (!confirm(`Send "${label}" email to ${client.email || "this client"}?`)) return;

    setSending(action);
    const res = await fetch(`/api/admin/clients/email?key=${adminKey}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        client_id: client.id,
        action,
        project_id: client.latest_project?.id,
        subject: customSubject,
        message: customMessage,
      }),
    });
    const data = await res.json();
    setSending(null);

    if (!res.ok) {
      onToast(data.error || "Could not send email", "error");
      return;
    }

    let msg = `Email sent to ${data.sentTo}`;
    if (data.projectActivated) msg += " · project set to Active";
    if (data.projectCompleted) msg += " · project marked Completed";
    onToast(msg);

    if (data.projectActivated || data.projectCompleted) onProjectUpdated?.();
    if (action === "custom") {
      setCustomSubject("");
      setCustomMessage("");
    }
  }

  const projectLabel = client.latest_project?.name || "No project yet";
  const hasEmail = Boolean(client.email?.trim());

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-semibold text-lux-cyan hover:underline"
      >
        {open ? "Hide email tools ▲" : "Email client ▼"}
      </button>

      {open && (
        <div className="mt-3 border border-white/[0.08] bg-lux-bg2/40 p-4 space-y-4">
          {emailReady === false && (
            <div className="text-xs text-amber-300 border border-amber-500/25 bg-amber-500/5 px-3 py-2 leading-relaxed">
              Emails are <strong>not configured</strong> on this server. Add{" "}
              <code className="text-amber-200">RESEND_API_KEY</code> and{" "}
              <code className="text-amber-200">EMAIL_FROM</code> in Vercel, then redeploy. Signup alerts also
              require this — that&apos;s likely why you missed the notification.
            </div>
          )}

          {!hasEmail && (
            <div className="text-xs text-red-400/90 border border-red-500/20 bg-red-500/5 px-3 py-2">
              No email on this client record. Edit the client and add their email first.
            </div>
          )}

          <div className="text-xs text-lux-muted">
            Send to: <span className="text-lux-text">{client.email || "—"}</span>
            {client.latest_project && (
              <>
                {" "}
                · Project: <span className="text-lux-cyan">{projectLabel}</span> (
                {client.latest_project.status})
              </>
            )}
            {notifyEmail && (
              <span className="block mt-1">Client replies go to {notifyEmail}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="lux"
              size="sm"
              disabled={!hasEmail || sending !== null || !client.latest_project}
              onClick={() => send("campaign_started")}
            >
              {sending === "campaign_started" ? "Sending…" : "Campaign started →"}
            </Button>
            <Button
              variant="lux-ghost"
              size="sm"
              disabled={!hasEmail || sending !== null || !client.latest_project}
              onClick={() => send("campaign_finished")}
            >
              {sending === "campaign_finished" ? "Sending…" : "Campaign finished →"}
            </Button>
          </div>
          <p className="text-[0.65rem] text-lux-muted leading-relaxed">
            <strong className="text-lux-text">Started</strong> tells them outreach is live and sets project to
            Active. <strong className="text-lux-text">Finished</strong> wraps the campaign and marks it Completed.
          </p>

          <div className="space-y-2 border-t border-white/[0.06] pt-4">
            <p className="text-[0.65rem] uppercase tracking-wider text-lux-muted font-bold">
              Custom message · client can reply
            </p>
            <input
              className="lux-input text-sm"
              placeholder="Subject — e.g. Quick update needed on your ICP"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
            />
            <textarea
              className={cn("lux-input min-h-[90px] text-sm w-full")}
              placeholder="Ask for anything — updated target list, approval on copy, meeting times… They reply directly to your inbox."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <Button
              variant="lux-ghost"
              size="sm"
              disabled={!hasEmail || sending !== null}
              onClick={() => send("custom")}
            >
              {sending === "custom" ? "Sending…" : "Send custom email →"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
