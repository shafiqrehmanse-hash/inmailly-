"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        inviteCode,
        refCode: refCode || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }
    router.push("/team/login?registered=1");
  }

  return (
    <TeamAuthLayout title="Join the team" subtitle="Invite code required">
      {refCode && (
        <p className="text-xs text-ws-cyan text-center mb-4 font-medium">Referred by: {refCode}</p>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} required />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />
        <Field label="Password" value={password} onChange={setPassword} type="password" required />
        <Field label="Confirm password" value={confirm} onChange={setConfirm} type="password" required />
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Invite code</label>
          <input
            type="text"
            required
            className="ws-input mt-1.5 font-mono uppercase tracking-wider"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-ws-ind text-white rounded-xl font-bricolage font-extrabold hover:bg-ind2 transition-all disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account →"}
        </button>
      </form>
      <p className="text-center text-sm text-white/40 mt-6">
        Already have an account?{" "}
        <Link href="/team/login" className="text-ws-cyan font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </TeamAuthLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">{label}</label>
      <input
        type={type}
        required={required}
        className="ws-input mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function TeamRegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
