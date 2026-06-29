"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import AuthSplitLayout, { AuthFormHeader } from "@/components/auth/AuthSplitLayout";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (member) {
        await supabase
          .from("team_members")
          .update({ last_login: new Date().toISOString() })
          .eq("id", member.id);
      }
    }
    router.push("/team/hub");
    router.refresh();
  }

  return (
    <AuthSplitLayout tab="login" onTabChange={(t) => router.push(t === "register" ? "/register" : "/login")}>
      <AuthFormHeader title="Welcome back" subtitle="Log in to your team account to manage your leads." />
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Email</label>
          <input
            type="email"
            required
            placeholder="you@email.com"
            className="input-field mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Password</label>
          <input
            type="password"
            required
            placeholder="Your password"
            className="input-field mt-1.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-ink text-white rounded-xl font-bricolage font-extrabold hover:bg-green-700 transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log In →"}
        </button>
      </form>
      <p className="text-center text-sm text-mid mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-green-700 font-semibold hover:underline">
          Join Team
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
