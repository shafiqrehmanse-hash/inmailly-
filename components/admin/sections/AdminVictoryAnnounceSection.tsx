"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LuxSelect from "@/components/ui/LuxSelect";
import { useAdminKey, useAdminToast } from "@/lib/admin-context";
import type { TeamMember } from "@/lib/types";

export default function AdminVictoryAnnounceSection() {
  const adminKey = useAdminKey();
  const showToast = useAdminToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [kind, setKind] = useState<"birthday" | "custom">("birthday");
  const [memberId, setMemberId] = useState("");
  const [message, setMessage] = useState("");
  const [hours, setHours] = useState("24");
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/admin/members?key=${adminKey}`);
    const data = await res.json();
    setMembers(
      (data.members || []).filter(
        (m: TeamMember) =>
          m.is_active && m.role !== "campaign_manager" && m.role !== "content_manager"
      )
    );
  }, [adminKey]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function publish() {
    const member = members.find((m) => m.id === memberId);
    if (!member && kind === "birthday") {
      showToast("Pick a team member", "error");
      return;
    }
    if (kind === "custom" && !message.trim()) {
      showToast("Write an announcement message", "error");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/admin/victory?key=${adminKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        kind,
        member_id: member?.id || null,
        member_name: member?.name || "Team",
        message: message.trim() || null,
        hours: Number(hours) || 24,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      showToast(data.error || "Could not publish", "error");
      return;
    }
    showToast("Team banner published — visible on all team pages");
    setMessage("");
  }

  return (
    <div className="lux-card-elite p-5 space-y-4 scroll-mt-6">
      <div>
        <h2 className="font-bricolage font-bold text-xl text-lux-text">Team victory banners</h2>
        <p className="text-sm text-lux-muted mt-1">
          Deal closed & meeting booked banners publish automatically. Use this for birthdays and custom announcements
          (24h+ top banner on every team page).
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Type</span>
          <LuxSelect
            className="mt-1"
            value={kind}
            onChange={(v) => setKind(v as "birthday" | "custom")}
            options={[
              { value: "birthday", label: "🎂 Birthday" },
              { value: "custom", label: "✦ Custom announcement" },
            ]}
          />
        </label>
        <label className="block">
          <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Duration (hours)</span>
          <input
            className="lux-input rounded-xl mt-1"
            type="number"
            min={1}
            max={168}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">
          Team member {members.length > 0 ? `(${members.length})` : ""}
        </span>
        <LuxSelect
          className="mt-1"
          value={memberId}
          onChange={setMemberId}
          options={[
            { value: "", label: "Select member…" },
            ...members.map((m) => ({ value: m.id, label: m.name })),
          ]}
        />
      </label>

      <label className="block">
        <span className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">
          {kind === "birthday" ? "Optional message" : "Announcement message"}
        </span>
        <textarea
          className="lux-input rounded-xl mt-1 min-h-[88px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            kind === "birthday"
              ? "Happy birthday! Wishing you an amazing year ahead…"
              : "Team announcement for everyone…"
          }
        />
      </label>

      <Button onClick={publish} disabled={saving}>
        {saving ? "Publishing…" : "Publish team banner"}
      </Button>
    </div>
  );
}
