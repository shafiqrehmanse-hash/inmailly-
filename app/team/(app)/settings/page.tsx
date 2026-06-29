"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";

export default function SettingsPage() {
  const supabase = createClient();
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
        <h1 className="font-bricolage font-extrabold text-2xl text-ink">Account Settings</h1>
        <p className="text-sm text-mid mt-1">
          Update your phone number so admin can reach you for urgent updates.
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-semibold">
          Settings saved successfully.
        </div>
      )}

      <div className="card-dark p-6 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-mid">Full name</label>
          <input className="input-field mt-1 bg-off text-mid" value={member.name} disabled />
          <p className="text-[0.72rem] text-dimmer mt-1">Contact admin to change your name.</p>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-mid">Email</label>
          <input className="input-field mt-1 bg-off text-mid" value={member.email} disabled />
        </div>
        <form onSubmit={save}>
          <label className="text-xs font-bold uppercase tracking-wide text-mid">
            WhatsApp / phone <span className="text-red">*</span>
          </label>
          <input
            type="tel"
            className="input-field mt-1"
            placeholder="+92 300 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-[0.72rem] text-dimmer mt-1">Include country code — e.g. +92, +1</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mt-4 mb-4">
            This number helps admin reach you for urgent updates and lead alerts.
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Save settings"}
          </Button>
        </form>
      </div>

      <div className="card-dark p-5">
        <h3 className="font-bricolage font-bold text-sm mb-3">Quick links</h3>
        <div className="space-y-2 text-sm">
          <Link href="/team/hub" className="block px-3 py-2 rounded-lg bg-off hover:bg-line text-ink">
            ← Back to Home
          </Link>
          <Link href="/team/links" className="block px-3 py-2 rounded-lg bg-off hover:bg-line text-ink">
            Work Links →
          </Link>
          <Link href="/team/leads" className="block px-3 py-2 rounded-lg bg-off hover:bg-line text-ink">
            My Leads →
          </Link>
        </div>
      </div>
    </div>
  );
}
