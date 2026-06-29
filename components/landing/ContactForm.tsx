"use client";

import { useState } from "react";

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
      <div className="bg-green-l border border-green/25 rounded-2xl p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="font-bricolage font-extrabold text-xl text-ink mb-2">Thanks!</h2>
        <p className="text-mid text-sm">We&apos;ll reply within 24 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Full name</label>
        <input required className="input-field mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Email</label>
        <input
          type="email"
          required
          className="input-field mt-1.5"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Company (optional)</label>
        <input className="input-field mt-1.5" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <div>
        <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Estimated volume</label>
        <select
          className="input-field mt-1.5"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        >
          <option value="">Select volume…</option>
          {VOLUMES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[0.78rem] font-bold uppercase tracking-wide text-mid">Message</label>
        <textarea
          rows={4}
          className="input-field mt-1.5 resize-y min-h-[100px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-[0.92rem] disabled:opacity-50">
        {loading ? "Sending…" : "Send message →"}
      </button>
    </form>
  );
}
