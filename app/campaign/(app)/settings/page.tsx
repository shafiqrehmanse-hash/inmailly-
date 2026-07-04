"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProfilePhotoCard from "@/components/team/ProfilePhotoCard";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";

export default function CampaignSettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [member, setMember] = useState<TeamMember | null>(null);

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
      if (data) setMember(data as TeamMember);
    })();
  }, [supabase]);

  if (!member) return null;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Profile settings</h1>
        <p className="text-sm text-lux-muted mt-1">
          Campaign managers use the same profile photo system as the outreach team — clear HD circle avatars.
        </p>
      </div>

      <ProfilePhotoCard member={member} onMemberChange={setMember} />

      <div className="lux-card p-6 space-y-3">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Full name</label>
          <input className="lux-input mt-1 opacity-60" value={member.name} disabled />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Email</label>
          <input className="lux-input mt-1 opacity-60" value={member.email} disabled />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Role</label>
          <input className="lux-input mt-1 opacity-60" value="Campaign manager" disabled />
        </div>
      </div>

      <Link
        href="/campaign/hub"
        className="block text-sm text-lux-cyan hover:underline"
      >
        ← Back to campaigns
      </Link>
    </div>
  );
}
