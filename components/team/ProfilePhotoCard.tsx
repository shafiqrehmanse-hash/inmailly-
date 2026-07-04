"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import TeamAvatar from "@/components/team/TeamAvatar";
import type { TeamMember } from "@/lib/types";

export default function ProfilePhotoCard({
  member,
  onMemberChange,
}: {
  member: TeamMember;
  onMemberChange: (m: TeamMember) => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoOk, setPhotoOk] = useState(false);

  async function onPhotoSelected(file: File | null) {
    if (!file) return;
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

    onMemberChange(data.member as TeamMember);
    setPhotoOk(true);
    router.refresh();
    setTimeout(() => setPhotoOk(false), 3000);
  }

  async function removePhoto() {
    if (!member.photo_url) return;
    setPhotoLoading(true);
    setPhotoError(null);
    const res = await fetch("/api/team/photo", { method: "DELETE" });
    const data = await res.json();
    setPhotoLoading(false);
    if (!res.ok) {
      setPhotoError(data.error || "Could not remove photo");
      return;
    }
    onMemberChange(data.member as TeamMember);
    router.refresh();
  }

  return (
    <div className="lux-card p-6 space-y-4">
      {photoOk && (
        <div className="bg-lux-cyan/10 border border-lux-cyan/25 text-lux-cyan rounded-xl px-4 py-3 text-sm font-semibold">
          Profile photo updated — HD circular avatar is live.
        </div>
      )}
      <div>
        <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Profile photo</label>
        <p className="text-[0.72rem] text-lux-muted mt-1 mb-4">
          Use a bright, front-facing photo. We auto-crop to a circle, sharpen, and save HD quality for the team
          board and sidebar.
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
  );
}
