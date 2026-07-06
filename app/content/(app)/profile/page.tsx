"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import ProfilePhotoCard from "@/components/team/ProfilePhotoCard";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";

export default function ContentProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("team_members").select("*").eq("user_id", user.id).single();
      if (data) {
        const m = data as TeamMember;
        setMember(m);
        setAuthorTitle(m.author_title || "");
        setAuthorBio(m.author_bio || "");
      }
    })();
  }, [supabase]);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/content/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author_title: authorTitle, author_bio: authorBio }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save profile");
      return;
    }
    if (data.member) setMember(data.member);
    setSaved(true);
  }

  if (!member) return null;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">Author profile</h1>
        <p className="text-sm text-lux-muted mt-1">
          Your photo, title, and bio appear on published articles and your author page.
        </p>
      </div>

      <ProfilePhotoCard member={member} onMemberChange={setMember} />

      <div className="lux-card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Display name</label>
          <input className="lux-input mt-1 opacity-60" value={member.name} disabled />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Author title</label>
          <input
            className="lux-input mt-1"
            value={authorTitle}
            onChange={(e) => setAuthorTitle(e.target.value)}
            placeholder="e.g. B2B outreach strategist"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Author bio</label>
          <textarea
            className="lux-input mt-1 min-h-[120px]"
            value={authorBio}
            onChange={(e) => setAuthorBio(e.target.value)}
            placeholder="Short bio shown under your byline on the blog…"
          />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {saved && <p className="text-sm text-emerald-400">Profile saved.</p>}
        <Button onClick={saveProfile} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <Link href="/content/hub" className="block text-sm text-lux-cyan hover:underline">
        ← Back to articles
      </Link>
    </div>
  );
}
