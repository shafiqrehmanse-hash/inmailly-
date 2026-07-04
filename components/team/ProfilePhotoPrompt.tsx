"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Button from "@/components/ui/Button";
import TeamAvatar from "@/components/team/TeamAvatar";
import type { TeamMember } from "@/lib/types";

function dismissKey(memberId: string) {
  return `inmailly-photo-prompt-later:${memberId}`;
}

export default function ProfilePhotoPrompt({ member }: { member: TeamMember }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(Boolean(member.photo_url));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (member.photo_url || done) {
      setOpen(false);
      return;
    }
    try {
      if (sessionStorage.getItem(dismissKey(member.id)) === "1") {
        setOpen(false);
        return;
      }
    } catch {
      /* ignore */
    }
    // Small delay so the dashboard paints first
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
  }, [member.id, member.photo_url, done]);

  function later() {
    try {
      sessionStorage.setItem(dismissKey(member.id), "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  async function onPhotoSelected(file: File | null) {
    if (!file) return;
    setError(null);
    setLoading(true);
    const form = new FormData();
    form.append("photo", file);
    const res = await fetch("/api/team/photo", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setDone(true);
    setOpen(false);
    try {
      sessionStorage.removeItem(dismissKey(member.id));
    } catch {
      /* ignore */
    }
    router.refresh();
  }

  if (!mounted || done || member.photo_url) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="photo-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-lux-cyan/30 bg-lux-bg2 shadow-[0_0_48px_rgba(34,211,238,0.12)]"
          >
            <div className="h-1 bg-gradient-to-r from-lux-cyan via-lux-violet to-amber-400" />
            <div className="px-6 py-8 text-center space-y-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-lux-cyan">
                Complete your profile
              </p>
              <div className="flex justify-center">
                <TeamAvatar name={member.name} photoUrl={null} size="xl" />
              </div>
              <div>
                <h2 className="font-bricolage font-extrabold text-xl text-lux-text">
                  Add your profile photo
                </h2>
                <p className="text-sm text-lux-muted mt-2 leading-relaxed">
                  Hi {member.name.split(" ")[0]}, upload a clear photo so you show up on the team
                  leaderboard and sidebar. We crop it to a sharp HD circle automatically.
                </p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => onPhotoSelected(e.target.files?.[0] || null)}
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="button"
                  variant="lux"
                  className="w-full"
                  disabled={loading}
                  onClick={() => fileRef.current?.click()}
                >
                  {loading ? "Processing HD photo…" : "Upload profile photo"}
                </Button>
                <button
                  type="button"
                  onClick={later}
                  disabled={loading}
                  className="text-xs text-lux-muted hover:text-lux-text py-2 transition-colors"
                >
                  I&apos;ll do it later
                </button>
              </div>
              <p className="text-[0.65rem] text-lux-muted/70">
                Once your photo is saved, this reminder won&apos;t show again.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
