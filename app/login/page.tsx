"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md card-dark border-indigo/20 p-8">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo to-cyan flex items-center justify-center font-bricolage font-extrabold">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-xl">InMailly</div>
            <div className="text-sm text-dim">Team Login</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-dimmer uppercase tracking-wide">Email</label>
            <input
              type="email"
              required
              className="input-field mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-dimmer uppercase tracking-wide">Password</label>
            <input
              type="password"
              required
              className="input-field mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full py-3">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-dim mt-6">
          No account?{" "}
          <Link href="/register" className="text-indigo2 hover:underline">
            Register with invite code
          </Link>
        </p>
      </div>
    </div>
  );
}
