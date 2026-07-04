"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import TeamAvatar from "@/components/team/TeamAvatar";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoOk, setPhotoOk] = useState(false);

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

  async function onPhotoSelected(file: File | null) {
    if (!file || !member) return;
    setPhotoError(null);
    setPhotoOk(false);
    setPhotoLoading(true);

    const form = new FormData();
    form.append("photo", file);

    const res = await fetch("/api/team/photo", { method: "POST", body: form });
    const data = await res.json();
    setPhotoLoading(false);

    if (!res.ok) {
      setPhotoError(data.error || "Upload failed");
      return;
    }

    setMember(data.member as TeamMember);
    setPhotoOk(true);
    router.refresh();
    setTimeout(() => setPhotoOk(false), 3000);
  }

  async function removePhoto() {
    if (!member?.photo_url) return;
    setPhotoLoading(true);
    setPhotoError(null);
    const res = await fetch("/api/team/photo", { method: "DELETE" });
    const data = await res.json();
    setPhotoLoading(false);
    if (!res.ok) {
      setPhotoError(data.error || "Could not remove photo");
      return;
    }
    setMember(data.member as TeamMember);
    router.refresh();
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

      {(saved || photoOk) && (
        <div className="bg-lux-cyan/10 border border-lux-cyan/25 text-lux-cyan rounded-xl px-4 py-3 text-sm font-semibold">
          {photoOk ? "Profile photo updated — HD circular avatar is live." : "Settings saved successfully."}
        </div>
      )}

      <div className="lux-card p-6 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Profile photo</label>
          <p className="text-[0.72rem] text-lux-muted mt-1 mb-4">
            Use a bright, front-facing photo. We auto-crop to a circle, sharpen, and save HD quality for the
            leaderboard.
          </p>
          <div className="flex items-center gap-5">
            <TeamAvatar name={member.name} photoUrl={member.photo_url} size="xl" />
            <div className="space-y-2 min-w-0">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPhotoSelected(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="lux"
                disabled={photoLoading}
                onClick={() => fileRef.current?.click()}
              >
                {photoLoading ? "Processing…" : member.photo_url ? "Change photo" : "Upload photo"}
              </Button>
              {member.photo_url && (
                <button
                  type="button"
                  disabled={photoLoading}
                  onClick={removePhoto}
                  className="block text-xs text-lux-muted hover:text-red-300 transition-colors"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
          {photoError && <p className="text-sm text-red-400 mt-3">{photoError}</p>}
        </div>
      </div>

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
