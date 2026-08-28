"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";

function ForgotForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/team-forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not send reset email");
      return;
    }
    setDone(true);
  }

  return (
    <TeamAuthLayout title="Forgot password" subtitle="We’ll email you a link to set a new one">
      {error && (
        <div
          role="alert"
          className="bg-red-500/20 border-2 border-red-500 rounded-xl px-4 py-3 text-sm mb-5 !text-red-500 font-extrabold leading-snug"
        >
          {error}
        </div>
      )}
      {done ? (
        <div className="space-y-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm">
            If that email is on the team, we sent a reset link. Check inbox and spam. The link expires in about an hour.
          </div>
          <Link href="/team/login" className="block text-center text-sm font-semibold text-lux-cyan hover:underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="ws-input mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-ws-ind text-white rounded-xl font-bricolage font-extrabold hover:bg-ind2 transition-all disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link →"}
          </button>
          <Link href="/team/login" className="block text-center text-xs text-ws-cyan hover:underline">
            Back to login
          </Link>
        </form>
      )}
    </TeamAuthLayout>
  );
}

export default function TeamForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotForm />
    </Suspense>
  );
}
