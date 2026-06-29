"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-ws-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-ws-card border border-ws-border rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ws-ind flex items-center justify-center font-bricolage font-extrabold text-white">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-lg text-white">InMailly Admin</div>
            <div className="text-xs text-white/40">Private access only</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-white/50">Secret key</label>
            <input
              type="password"
              required
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-ws-ind/40"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin key"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-ws-ind text-white font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {loading ? "Checking…" : "Enter admin →"}
          </button>
        </form>
      </div>
    </div>
  );
}
