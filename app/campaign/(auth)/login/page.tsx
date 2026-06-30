"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { getLoginRedirect } from "@/lib/roles";

export default function CampaignLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
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

      if (!member) {
        setError("No campaign manager account found.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (member.role !== "campaign_manager") {
        setError("This login is for campaign managers only. Use /team/login for outreach work.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      await supabase
        .from("team_members")
        .update({ last_login: new Date().toISOString() })
        .eq("id", member.id);
    }

    router.push(getLoginRedirect("campaign_manager"));
    router.refresh();
  }

  return (
    <TeamAuthLayout
      title="Campaign Manager"
      subtitle="Client campaigns & portal responses"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">
            Email
          </label>
          <input
            type="email"
            required
            className="ws-input mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">
            Password
          </label>
          <PasswordInput className="mt-1.5" value={password} onChange={setPassword} required />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-lux-violet to-lux-cyan text-white rounded-xl font-bricolage font-extrabold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log in →"}
        </button>
      </form>
      <p className="text-center text-xs text-white/30 mt-6">
        Outreach workers:{" "}
        <a href="/team/login" className="text-lux-cyan hover:underline">
          /team/login
        </a>
      </p>
    </TeamAuthLayout>
  );
}
