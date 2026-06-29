"use client";

import { useState } from "react";
import { brandingData } from "@/lib/branding";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  const defaultLabel = label || "Copy";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`px-3 py-1.5 rounded-lg border text-[0.72rem] font-bold transition-colors ${
        ok ? "bg-green-50 border-green-300 text-green-700" : "bg-off border-line hover:bg-line"
      }`}
    >
      {ok ? "Copied!" : defaultLabel}
    </button>
  );
}

export default function BrandingPage() {
  const b = brandingData;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-bricolage font-extrabold text-2xl tracking-tight text-ink">
          Apply InMailly branding
        </h1>
        <p className="text-mid text-sm mt-2 leading-relaxed max-w-xl">
          Copy approved headlines, job titles, about text, and skills straight into your LinkedIn
          profile. Paste into LinkedIn → Edit profile for each section.
        </p>
      </div>

      <div className="card-dark p-5 sm:p-6">
        <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2">
          <span className="w-1 h-5 bg-green-600 rounded-sm" />
          Headline options
        </h2>
        <p className="text-[0.78rem] text-mid mt-2 mb-4">
          Pick one for your LinkedIn headline, then tap Copy and paste into LinkedIn → Edit profile
          → Headline.
        </p>
        <div className="divide-y divide-line">
          {b.headlines.map((headline, i) => (
            <div key={headline} className="flex items-start gap-3 py-3 first:pt-0">
              <span className="font-bricolage font-extrabold text-xs text-green-700 min-w-[24px] pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="flex-1 text-sm leading-relaxed text-ink">{headline}</p>
              <CopyButton text={headline} />
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark p-5 sm:p-6">
        <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2">
          <span className="w-1 h-5 bg-green-600 rounded-sm" />
          Job title options
        </h2>
        <p className="text-[0.78rem] text-mid mt-2 mb-4">
          Use one of these for your Experience title or current role on LinkedIn.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {b.jobTitles.map((t) => (
            <span key={t} className="px-3 py-2 rounded-full bg-off border border-line text-[0.78rem]">
              {t}
            </span>
          ))}
        </div>
        <CopyButton text={b.jobTitles.join("\n")} label="Copy all titles" />
      </div>

      <div className="card-dark p-5 sm:p-6">
        <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2">
          <span className="w-1 h-5 bg-green-600 rounded-sm" />
          About section
        </h2>
        <p className="text-[0.78rem] text-mid mt-2 mb-3">
          Paste into LinkedIn → About. Personalize lightly if needed.
        </p>
        <div className="bg-off border border-line rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap mb-3">
          {b.about}
        </div>
        <CopyButton text={b.about} label="Copy about text" />
      </div>

      <div className="card-dark p-5 sm:p-6">
        <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2">
          <span className="w-1 h-5 bg-green-600 rounded-sm" />
          Company description
        </h2>
        <p className="text-[0.78rem] text-mid mt-2 mb-3">
          Use for InMailly experience entry or when describing who you work with.
        </p>
        <div className="bg-off border border-line rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap mb-3">
          {b.company}
        </div>
        <CopyButton text={b.company} label="Copy company text" />
      </div>

      <div className="card-dark p-5 sm:p-6">
        <h2 className="font-bricolage font-extrabold text-base flex items-center gap-2">
          <span className="w-1 h-5 bg-green-600 rounded-sm" />
          Core skills
        </h2>
        <p className="text-[0.78rem] text-mid mt-2 mb-3">
          Add these to your LinkedIn Skills section.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {b.skills.map((s) => (
            <span key={s} className="px-3 py-2 rounded-full bg-off border border-line text-[0.78rem]">
              {s}
            </span>
          ))}
        </div>
        <CopyButton text={b.skills.join(", ")} label="Copy all skills" />
      </div>
    </div>
  );
}
