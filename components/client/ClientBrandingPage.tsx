"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type BrandingData = {
  pendingRequest: { id: string; package_size: number | null } | null;
  project: {
    id: string;
    name: string;
    inmail_package_size: number | null;
  } | null;
};

export default function ClientBrandingPage() {
  const router = useRouter();
  const [data, setData] = useState<BrandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    inmail_subject: "",
    inmail_script: "",
    sales_nav_direct_link: "",
    sales_nav_link_count: "",
    profile_links_paste: "",
  });

  useEffect(() => {
    fetch("/api/client/branding")
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/client/login");
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (!d) return;
        setData(d);
        const pkg = d.pendingRequest?.package_size ?? d.project?.inmail_package_size;
        if (pkg) setForm((f) => ({ ...f, sales_nav_link_count: String(pkg) }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.pendingRequest) return;
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/client/branding/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        request_id: data.pendingRequest.id,
        ...form,
        sales_nav_link_count: parseInt(form.sales_nav_link_count, 10),
        profile_links_paste: form.profile_links_paste.trim() || undefined,
      }),
    });
    const result = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(result.error || "Could not submit branding");
      return;
    }

    router.push("/client/dashboard?branding=submitted");
  }

  if (loading) {
    return <p className="text-lux-muted">Loading…</p>;
  }

  if (!data?.pendingRequest) {
    return (
      <div className="lux-card p-8 max-w-xl">
        <p className="text-lux-muted mb-4">No branding request is pending right now.</p>
        <Link href="/client/dashboard" className="text-lux-cyan hover:underline text-sm font-semibold">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const packageSize = data.pendingRequest.package_size ?? data.project?.inmail_package_size;

  return (
    <div className="max-w-2xl">
      <Link href="/client/dashboard" className="text-sm text-lux-muted hover:text-lux-cyan mb-6 inline-block">
        ← Back to dashboard
      </Link>

      <div className="lux-card-elite p-6 sm:p-8 border-red-500/30 mb-6">
        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="admin-alert-dot shrink-0 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)]"
            aria-hidden
          />
          <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-red-400">
            Branding required
          </p>
        </div>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text mb-2">
          Submit campaign branding
        </h1>
        <p className="text-sm text-lux-muted leading-relaxed">
          {data.project?.name ? (
            <>
              For <strong className="text-lux-text">{data.project.name}</strong>
              {packageSize ? (
                <>
                  {" "}
                  · your package is <strong className="text-lux-cyan">{packageSize.toLocaleString()} InMails</strong>
                </>
              ) : null}
              . Fill in the fields below — your campaign manager and admin team receive this automatically.
            </>
          ) : (
            "Fill in the fields below. Your campaign manager and admin team receive this automatically."
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="lux-card p-6 sm:p-8 space-y-5">
        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">
            InMail subject *
          </label>
          <input
            className="lux-input mt-1.5 w-full"
            placeholder="e.g. Quick intro — scaling outreach at {company}"
            value={form.inmail_subject}
            onChange={(e) => setForm({ ...form, inmail_subject: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">
            InMail script *
          </label>
          <textarea
            className={cn("lux-input mt-1.5 w-full min-h-[140px]")}
            placeholder="Your full InMail message body — what prospects should read when they open the message."
            value={form.inmail_script}
            onChange={(e) => setForm({ ...form, inmail_script: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">
            Sales Nav direct link *
          </label>
          <input
            className="lux-input mt-1.5 w-full font-mono text-sm"
            placeholder="https://www.linkedin.com/sales/..."
            value={form.sales_nav_direct_link}
            onChange={(e) => setForm({ ...form, sales_nav_direct_link: e.target.value })}
            required
          />
          <p className="text-xs text-lux-muted mt-1.5">
            Paste the Sales Navigator list or search URL your team should send from.
          </p>
        </div>

        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">
            Sales Nav links — exact send number *
          </label>
          <input
            className="lux-input mt-1.5 w-full"
            type="number"
            min={1}
            placeholder={packageSize ? String(packageSize) : "e.g. 1000"}
            value={form.sales_nav_link_count}
            onChange={(e) => setForm({ ...form, sales_nav_link_count: e.target.value })}
            required
          />
          {packageSize ? (
            <p className="text-xs text-lux-muted mt-1.5">
              Your chosen package: <strong className="text-lux-cyan">{packageSize.toLocaleString()}</strong> — enter
              the exact number of profiles to send to.
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-[0.72rem] font-bold uppercase tracking-wide text-lux-muted">
            Profile links paste {packageSize ? `(${packageSize.toLocaleString()} expected)` : ""}
          </label>
          <textarea
            className={cn("lux-input mt-1.5 w-full min-h-[200px] font-mono text-xs leading-relaxed")}
            placeholder={
              packageSize
                ? `Paste ${packageSize.toLocaleString()} LinkedIn profile URLs here — one per line, or comma/tab separated`
                : "Paste your LinkedIn profile URLs — one per line, or comma/tab separated (1,000 · 5,000 · 20,000)"
            }
            value={form.profile_links_paste}
            onChange={(e) => setForm({ ...form, profile_links_paste: e.target.value })}
          />
          <p className="text-xs text-lux-muted mt-1.5 leading-relaxed">
            Paste the full list of profiles for your package. These go to your admin info desk and can be imported to
            the outreach pool. Same profile with different URL formats counts once.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 border border-red-500/25 bg-red-500/5 px-3 py-2">{error}</p>
        )}

        <Button variant="lux" type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Submitting…" : "Submit branding →"}
        </Button>
      </form>
    </div>
  );
}
