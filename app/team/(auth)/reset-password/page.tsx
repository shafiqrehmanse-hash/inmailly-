"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";
import { getLoginRedirect } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

export default function TeamResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/team/forgot-password");
        return;
      }
      setReady(true);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: member } = await supabase
        .from("team_members")
        .select("id, role")
        .eq("user_id", user.id)
        .single();
      if (member) {
        await supabase
          .from("team_members")
          .update({ last_login: new Date().toISOString() })
          .eq("id", member.id);
        router.push(getLoginRedirect(member.role as "member"));
        router.refresh();
        return;
      }
    }
    router.push("/team/login");
  }

  if (!ready) {
    return (
      <TeamAuthLayout title="Set new password" subtitle="Checking your reset link…">
        <p className="text-sm text-lux-muted text-center">Please wait…</p>
      </TeamAuthLayout>
    );
  }

  return (
    <TeamAuthLayout title="Set new password" subtitle="Choose a password for your team login">
      {error && (
        <div
          role="alert"
          className="bg-red-500/20 border-2 border-red-500 rounded-xl px-4 py-3 text-sm mb-5 !text-red-500 font-extrabold leading-snug"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">New password</label>
          <PasswordInput className="mt-1.5" value={password} onChange={setPassword} required />
        </div>
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Confirm password</label>
          <PasswordInput className="mt-1.5" value={confirm} onChange={setConfirm} required />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-ws-ind text-white rounded-xl font-bricolage font-extrabold hover:bg-ind2 transition-all disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save password & continue →"}
        </button>
      </form>
    </TeamAuthLayout>
  );
}
