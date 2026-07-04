"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TeamAuthLayout from "@/components/team/TeamAuthLayout";
import PasswordInput from "@/components/ui/PasswordInput";

function RegisterForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const cleanedPhone = phone.replace(/[^+0-9]/g, "");
    if (!cleanedPhone || cleanedPhone.length < 8) {
      setError("Enter a valid WhatsApp / phone number with country code");
      return;
    }
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
        phone: cleanedPhone,
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
    setSentTo(email.trim().toLowerCase());
    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <TeamAuthLayout title="Check your email" subtitle="Verify before you can access the team workspace">
        <div className="bg-ws-ind/10 border border-ws-ind/30 rounded-xl px-5 py-5 mb-5 space-y-3">
          <p className="text-sm text-ws-cyan font-semibold">Verification email sent</p>
          <p className="text-sm text-white/70 leading-relaxed">
            We sent a link to <strong className="text-white">{sentTo}</strong>. Click{" "}
            <strong className="text-white">Verify email &amp; join team</strong> in that message to unlock your
            workspace.
          </p>
          <p className="text-xs text-white/40">Check spam if you don&apos;t see it within a minute.</p>
        </div>
        <Link
          href="/team/login"
          className="block w-full text-center py-3.5 border border-white/15 text-white/80 rounded-xl text-sm font-semibold hover:border-ws-cyan/40 hover:text-ws-cyan transition-colors"
        >
          Already verified? Log in →
        </Link>
      </TeamAuthLayout>
    );
  }

  return (
    <TeamAuthLayout title="Join the team" subtitle="Invite code required — email verification required">
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
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">
            WhatsApp / phone
          </label>
          <input
            type="tel"
            required
            className="ws-input mt-1.5"
            placeholder="+92 300 1234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-[0.65rem] text-white/35 mt-1">Include country code so admin can reach you.</p>
        </div>
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Password</label>
          <PasswordInput className="mt-1.5" value={password} onChange={setPassword} required />
        </div>
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-white/40">Confirm password</label>
          <PasswordInput className="mt-1.5" value={confirm} onChange={setConfirm} required />
        </div>
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
