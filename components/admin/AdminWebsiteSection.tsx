"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  SITE_SECTIONS,
  type SiteSection,
} from "@/lib/site-content-defaults";

const SECTION_LABELS: Record<SiteSection, string> = {
  hero: "Hero",
  stats: "Stats",
  pricing: "Pricing",
  faq: "FAQ",
  testimonials: "Testimonials",
  finalCta: "Final CTA",
  contact: "Contact page",
  trial: "Free trial toggle",
};

export default function AdminWebsiteSection({
  adminKey,
  onToast,
}: {
  adminKey: string;
  onToast: (msg: string, type?: "success" | "error") => void;
}) {
  const headers = { "Content-Type": "application/json", "x-admin-key": adminKey };
  const [section, setSection] = useState<SiteSection>("hero");
  const [json, setJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/site-content?key=${adminKey}`);
    const data = await res.json();
    if (data.sections?.[section]) {
      setJson(JSON.stringify(data.sections[section], null, 2));
    }
    setLoading(false);
  }, [adminKey, section]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      onToast("Invalid JSON — check syntax", "error");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/site-content?key=${adminKey}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ section, data: parsed }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      onToast(data.error, "error");
      return;
    }
    onToast(`${SECTION_LABELS[section]} saved — live on homepage`);
  }

  async function resetSection() {
    const res = await fetch(`/api/admin/site-content?key=${adminKey}`);
    const data = await res.json();
    if (data.defaults?.[section]) {
      setJson(JSON.stringify(data.defaults[section], null, 2));
      onToast("Reset to defaults (not saved yet)");
    }
  }

  return (
    <div className="space-y-6">
      <div className="lux-card p-5 border-lux-violet/20">
        <h3 className="font-bricolage font-bold text-lux-text mb-2">Website CMS</h3>
        <p className="text-sm text-lux-muted leading-relaxed">
          Edit landing page copy, pricing, FAQ, testimonials, and contact text. Changes appear on the
          public site within ~1 minute. Campaign managers use{" "}
          <code className="text-lux-cyan">/campaign/login</code> — separate from outreach workers.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SITE_SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              section === s
                ? "border-lux-violet bg-lux-violet/15 text-lux-text"
                : "border-white/[0.08] text-lux-muted hover:text-lux-text hover:border-white/[0.15]"
            }`}
          >
            {SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="lux-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="admin-section-title">{SECTION_LABELS[section]} content</p>
          <div className="flex gap-2">
            <Button variant="lux-ghost" size="sm" onClick={resetSection}>
              Reset defaults
            </Button>
            <Button variant="lux" size="sm" onClick={save} disabled={saving || loading}>
              {saving ? "Saving…" : "Save section"}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-lux-muted">Loading…</p>
        ) : (
          <textarea
            className="lux-input min-h-[420px] font-mono text-xs leading-relaxed"
            value={json}
            onChange={(e) => setJson(e.target.value)}
            spellCheck={false}
          />
        )}

        <p className="text-xs text-lux-muted">
          Tip: arrays like <code className="text-lux-cyan">items</code> or{" "}
          <code className="text-lux-cyan">plans</code> support multiple entries. Keep valid JSON.
        </p>
      </div>
    </div>
  );
}
