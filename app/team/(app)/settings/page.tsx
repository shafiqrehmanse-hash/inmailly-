"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ProfilePhotoCard from "@/components/team/ProfilePhotoCard";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setMember(data as TeamMember);
        setPhone(data.phone || "");
      }
    })();
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    setLoading(true);
    const cleaned = phone.replace(/[^+0-9]/g, "") || null;
    await supabase.from("team_members").update({ phone: cleaned }).eq("id", member.id);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!member) return null;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Account Settings</h1>
        <p className="text-sm text-lux-muted mt-1">
          Add a clear profile photo and phone so the team board looks professional and admin can reach you.
        </p>
      </div>

      {saved && (
        <div className="bg-lux-cyan/10 border border-lux-cyan/25 text-lux-cyan rounded-xl px-4 py-3 text-sm font-semibold">
          Settings saved successfully.
        </div>
      )}

      <ProfilePhotoCard member={member} onMemberChange={setMember} />

      <div className="lux-card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Full name</label>
          <input className="lux-input mt-1 opacity-60" value={member.name} disabled />
          <p className="text-[0.72rem] text-lux-muted/70 mt-1">Contact admin to change your name.</p>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Email</label>
          <input className="lux-input mt-1 opacity-60" value={member.email} disabled />
        </div>
        <form onSubmit={save}>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">
            WhatsApp / phone <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            className="lux-input mt-1"
            placeholder="+92 300 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-[0.72rem] text-lux-muted/70 mt-1">Include country code — e.g. +92, +1</p>
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-sm text-amber-300 mt-4 mb-4">
            This number helps admin reach you for urgent updates and lead alerts.
          </div>
          <Button type="submit" variant="lux" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </div>

      <div className="lux-card p-5">
        <h3 className="font-bricolage font-bold text-sm mb-3 text-lux-text">Quick links</h3>
        <div className="space-y-2 text-sm">
          <Link
            href="/team/hub"
            className="block px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-lux-text"
          >
            ← Back to Home
          </Link>
          <Link
            href="/team/performance"
            className="block px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-lux-text"
          >
            Team performance →
          </Link>
          <Link
            href="/team/leads"
            className="block px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-lux-text"
          >
            My Leads →
          </Link>
        </div>
      </div>
    </div>
  );
}
