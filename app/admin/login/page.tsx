"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LuxBackground from "@/components/home/LuxBackground";

export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Wrong secret key. Try again.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen bg-lux-bg flex items-center justify-center p-6">
      <LuxBackground />
      <div className="relative w-full max-w-md lux-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 border border-lux-blue/40 bg-lux-blue/10 flex items-center justify-center font-bricolage font-extrabold text-lux-blue">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-lg text-lux-text">InMailly Admin</div>
            <div className="text-xs text-lux-muted">Private access only</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Secret key</label>
            <input
              type="password"
              required
              className="lux-input mt-1.5"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin key"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="lux-btn-primary w-full disabled:opacity-50">
            {loading ? "Checking…" : "Enter admin →"}
          </button>
        </form>
      </div>
    </div>
  );
}
