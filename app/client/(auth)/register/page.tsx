"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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

    const res = await fetch("/api/auth/client-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, company }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Registration failed");
      return;
    }

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      router.push("/client/login?registered=1");
      return;
    }
    router.push("/client/dashboard");
    router.refresh();
  }

  return (
    <TeamAuthLayout title="Create client account" subtitle="See your campaign dashboard — no free trial spam">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} required />
        <Field label="Work email" type="email" value={email} onChange={setEmail} required />
        <Field label="Company" value={company} onChange={setCompany} placeholder="Your company name" />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} required />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-lux-blue to-lux-cyan text-white rounded-xl font-bricolage font-extrabold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account →"}
        </button>
      </form>
      <p className="text-center text-xs text-white/30 mt-6">
        Already have an account?{" "}
        <Link href="/client/login" className="text-lux-cyan hover:underline">
          Log in
        </Link>
      </p>
      <p className="text-center text-xs text-white/25 mt-3">
        Team member?{" "}
        <Link href="/team/login" className="text-white/40 hover:underline">
          /team/login
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        className="ws-input mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function ClientRegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
