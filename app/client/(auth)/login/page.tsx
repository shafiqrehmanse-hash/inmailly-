"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
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

    const meRes = await fetch("/api/client/me");
    if (meRes.ok) {
      router.push("/client/dashboard");
      router.refresh();
      return;
    }

    const meData = await meRes.json().catch(() => ({}));
    await supabase.auth.signOut();
    setLoading(false);
    setError(
      meData.error === "team_account"
        ? "This is a team account. Use /team/login instead."
        : "No client account found. Register at /client/register or run migration 008 in Supabase."
    );
  }

  return (
    <TeamAuthLayout title="Client login" subtitle="Your campaign dashboard">
      {verified && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm mb-5">
          Email verified — log in to open your dashboard.
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
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Email</label>
          <input
            type="email"
            required
            className="ws-input mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Password</label>
          <input
            type="password"
            required
            className="ws-input mt-1.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-lux-blue to-lux-cyan text-white rounded-xl font-bricolage font-extrabold hover:opacity-90 transition-all disabled:opacity-50"
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
        New here?{" "}
        <Link href="/client/register" className="text-lux-cyan hover:underline">
          Create account
        </Link>
      </p>
    </TeamAuthLayout>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
