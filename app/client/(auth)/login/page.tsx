"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
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
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!client) {
        const { data: member } = await supabase
          .from("team_members")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        await supabase.auth.signOut();
        setLoading(false);
        setError(
          member
            ? "This is a team account. Use /team/login instead."
            : "No client account found for this email."
        );
        return;
      }
    }

    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <TeamAuthLayout title="Client login" subtitle="Your campaign dashboard">
      {registered && (
        <div className="bg-lux-cyan/10 border border-lux-cyan/30 text-lux-cyan rounded-xl px-4 py-3 text-sm mb-5">
          Account created — log in to see your dashboard.
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
