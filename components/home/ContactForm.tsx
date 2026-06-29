"use client";

import { useState } from "react";
import LuxSelect from "@/components/ui/LuxSelect";

const VOLUMES = ["1,000 messages", "5,000 messages", "20,000 messages", "50,000+ messages"];

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [volume, setVolume] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, company, volume, message }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="border border-lux-cyan/30 bg-lux-cyan/5 p-10 text-center">
        <div className="font-bricolage font-extrabold text-2xl text-lux-cyan mb-2">Received.</div>
        <p className="text-lux-muted text-sm">We&apos;ll reply within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-3 text-sm">{error}</div>
      )}
      {[
        { label: "Full name", value: name, set: setName, type: "text", req: true },
        { label: "Email", value: email, set: setEmail, type: "email", req: true },
        { label: "Company", value: company, set: setCompany, type: "text", req: false },
      ].map((f) => (
        <div key={f.label}>
          <label className="text-[0.65rem] uppercase tracking-[0.15em] text-lux-muted font-semibold">
            {f.label}
          </label>
          <input
            type={f.type}
            required={f.req}
            className="lux-input mt-2"
            value={f.value}
            onChange={(e) => f.set(e.target.value)}
          />
        </div>
      ))}
      <div>
        <label className="text-[0.65rem] uppercase tracking-[0.15em] text-lux-muted font-semibold">
          Estimated volume
        </label>
        <LuxSelect
          className="mt-2"
          value={volume}
          onChange={setVolume}
          placeholder="Select volume…"
          options={VOLUMES.map((v) => ({ value: v, label: v }))}
        />
      </div>
      <div>
        <label className="text-[0.65rem] uppercase tracking-[0.15em] text-lux-muted font-semibold">
          Message
        </label>
        <textarea
          rows={4}
          className="lux-input mt-2 resize-y min-h-[120px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="lux-btn-primary w-full disabled:opacity-50">
        {loading ? "Sending…" : "Send message →"}
      </button>
    </form>
  );
}
