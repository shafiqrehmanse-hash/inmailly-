"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";
import { getLoginRedirect } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyRequired = searchParams.get("verify") === "required";
  const verifyFailed = searchParams.get("error") === "verify_failed";
  const verified = searchParams.get("verified") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function resendVerification() {
    if (!email.trim()) {
      setError("Enter your email first, then click resend.");
      return;
    }
    setResending(true);
    setError("");
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setResending(false);
    if (!res.ok) {
      setError(data.error || "Could not resend verification email");
      return;
    }
    setInfo("Verification email sent — check your inbox (and spam).");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setLoading(false);
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Please verify your email first. Use the link we sent, or resend below.");
      } else {
        setError(authError.message);
      }
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && !user.email_confirmed_at) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Please verify your email before logging in. Resend the link below.");
      return;
    }
    if (user?.email_confirmed_at) {
      void fetch("/api/auth/complete-verification", { method: "POST" });
    }

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
      {verifyRequired && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl px-4 py-3 text-sm mb-5">
          Verify your email before opening the campaign workspace. Check your inbox or resend below.
        </div>
      )}
      {verifyFailed && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-5">
          Verification link expired or invalid. Request a new one below.
        </div>
      )}
      {verified && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm mb-5">
          Email verified — log in to open your campaign hub.
        </div>
      )}
      {info && (
        <div className="bg-lux-cyan/10 border border-lux-cyan/30 text-lux-cyan rounded-xl px-4 py-3 text-sm mb-5">
          {info}
        </div>
      )}
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
      <button
        type="button"
        onClick={resendVerification}
        disabled={resending}
        className="w-full mt-3 text-center text-xs text-lux-cyan hover:underline disabled:opacity-50"
      >
        {resending ? "Sending…" : "Resend verification email"}
      </button>
      <p className="text-center text-xs text-white/30 mt-6">
        Outreach workers:{" "}
        <a href="/team/login" className="text-lux-cyan hover:underline">
          /team/login
        </a>
      </p>
    </TeamAuthLayout>
  );
}

export default function CampaignLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
