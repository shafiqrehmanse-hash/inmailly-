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
    <div className="min-h-screen bg-off flex items-center justify-center p-6">
      <div className="w-full max-w-md admin-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ind to-ind2 flex items-center justify-center font-bricolage font-extrabold text-white">
            I
          </div>
          <div>
            <div className="font-bricolage font-extrabold text-lg text-ink">InMailly Admin</div>
            <div className="text-xs text-dim">Private access only</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-mid">Secret key</label>
            <input
              type="password"
              required
              className="input-field mt-1.5"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter admin key"
            />
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-50">
            {loading ? "Checking…" : "Enter admin →"}
          </button>
        </form>
      </div>
    </div>
  );
}
