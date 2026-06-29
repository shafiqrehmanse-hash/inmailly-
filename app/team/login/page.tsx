"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
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
    <TeamAuthLayout title="Team Login" subtitle="Internal outreach workspace">
      {registered && (
        <div className="bg-ws-ind/10 border border-ws-ind/30 text-ws-cyan rounded-xl px-4 py-3 text-sm mb-5">
          Account created — you can log in now.
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
          className="w-full py-3.5 bg-ws-ind text-white rounded-xl font-bricolage font-extrabold hover:bg-ind2 transition-all disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log in →"}
        </button>
      </form>
      <p className="text-center text-xs text-white/30 mt-6">Need access? Contact admin</p>
    </TeamAuthLayout>
  );
}

export default function TeamLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
