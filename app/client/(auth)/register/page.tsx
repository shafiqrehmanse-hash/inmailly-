"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [sentTo, setSentTo] = useState("");

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
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Registration failed");
      return;
    }

    if (data.verifyEmail) {
      setSentTo(email.trim().toLowerCase());
      setCheckEmail(true);
      return;
    }
  }

  if (checkEmail) {
    return (
      <TeamAuthLayout title="Check your email" subtitle="One more step to unlock your dashboard">
        <div className="bg-lux-cyan/10 border border-lux-cyan/30 rounded-xl px-5 py-5 mb-5 space-y-3">
          <p className="text-sm text-lux-cyan font-semibold">Verification email sent</p>
          <p className="text-sm text-white/70 leading-relaxed">
            We sent a link to <strong className="text-white">{sentTo}</strong>. Click{" "}
            <strong className="text-white">Verify email &amp; open dashboard</strong> in that message to
            continue.
          </p>
          <p className="text-xs text-white/40">Check spam if you don&apos;t see it within a minute.</p>
        </div>
        <Link
          href="/client/login"
          className="block w-full text-center py-3.5 border border-white/15 text-white/80 rounded-xl text-sm font-semibold hover:border-lux-cyan/40 hover:text-lux-cyan transition-colors"
        >
          Already verified? Log in →
        </Link>
      </TeamAuthLayout>
    );
  }

  return (
    <TeamAuthLayout title="Create client account" subtitle="See your campaign dashboard — verify your email to get in">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm mb-5">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} required />
        <Field label="Work email" type="email" value={email} onChange={setEmail} required />
        <Field label="Company" value={company} onChange={setCompany} placeholder="Your company name" />
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Password</label>
          <PasswordInput className="mt-1.5" value={password} onChange={setPassword} required />
        </div>
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Confirm password</label>
          <PasswordInput className="mt-1.5" value={confirm} onChange={setConfirm} required />
        </div>
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
