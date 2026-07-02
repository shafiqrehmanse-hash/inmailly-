"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LuxBackground from "@/components/home/LuxBackground";
import { InMaillyBrand } from "@/components/brand/InMaillyLogo";
import PasswordInput from "@/components/ui/PasswordInput";

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
        <div className="mb-8">
          <InMaillyBrand size="md" />
          <div className="text-xs text-lux-muted mt-2">Admin · Private access only</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-lux-muted">Secret key</label>
            <PasswordInput
              className="mt-1.5"
              inputClassName="lux-input"
              variant="lux"
              value={key}
              onChange={setKey}
              required
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
