"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthSplitLayout, { AuthFormHeader } from "@/components/auth/AuthSplitLayout";

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
    router.push("/login?registered=1");
  }

  return (
    <AuthSplitLayout tab="register" onTabChange={(t) => router.push(t === "login" ? "/login" : "/register")}>
      <AuthFormHeader title="Join the team" subtitle="Create your account with an invite code from admin." />
      {refCode && (
        <p className="text-xs text-ind text-center mb-4 font-medium">Referred by code: {refCode}</p>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} required />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />
        <Field label="Password" value={password} onChange={setPassword} type="password" required />
        <Field label="Confirm password" value={confirm} onChange={setConfirm} type="password" required />
        <div>
          <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Invite code</label>
          <input
            type="text"
            required
            className="input-field mt-1.5 font-mono font-bold uppercase tracking-wider text-green-700"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-ink text-white rounded-xl font-bricolage font-extrabold hover:bg-green-700 transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Join Team →"}
        </button>
      </form>
      <p className="text-center text-sm text-mid mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-green-700 font-semibold hover:underline">
          Log In
        </Link>
      </p>
    </AuthSplitLayout>
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
      <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">{label}</label>
      <input
        type={type}
        required={required}
        className="input-field mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
