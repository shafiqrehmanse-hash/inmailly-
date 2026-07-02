"use client";

type BrandingInfo = {
  branding_pending?: boolean;
  branding_submitted?: boolean;
  inmail_subject?: string | null;
  inmail_script?: string | null;
  sales_nav_direct_link?: string | null;
  sales_nav_link_count?: number | null;
  branding_submitted_at?: string | null;
};

export default function AdminClientBrandingPanel({
  projectId,
  branding,
}: {
  projectId?: string | null;
  branding?: BrandingInfo | null;
}) {
  if (!projectId || !branding) return null;

  if (branding.branding_pending) {
    return (
      <div className="mt-3 border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="admin-alert-dot shrink-0 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
          <p className="text-[0.65rem] uppercase tracking-wider text-amber-300 font-bold">
            Branding requested — waiting on client
          </p>
        </div>
        <p className="text-xs text-lux-muted leading-relaxed">
          Client has a red alert on their dashboard. They must submit InMail subject, script, Sales Nav link, and send
          count.
        </p>
      </div>
    );
  }

  if (!branding.branding_submitted) return null;

  return (
    <div className="mt-3 border border-emerald-500/25 bg-emerald-500/5 px-3 py-3 rounded-lg space-y-2">
      <p className="text-[0.65rem] uppercase tracking-wider text-emerald-400 font-bold">
        Client branding submitted
        {branding.branding_submitted_at ? (
          <span className="text-lux-muted font-normal normal-case tracking-normal ml-2">
            {new Date(branding.branding_submitted_at).toLocaleDateString()}
          </span>
        ) : null}
      </p>
      <div className="grid sm:grid-cols-2 gap-2 text-xs">
        {branding.inmail_subject && (
          <div className="bg-black/20 border border-white/[0.06] rounded-lg p-2.5 sm:col-span-2">
            <div className="text-lux-muted mb-0.5">InMail subject</div>
            <div className="text-lux-text font-medium">{branding.inmail_subject}</div>
          </div>
        )}
        {branding.sales_nav_direct_link && (
          <div className="bg-black/20 border border-white/[0.06] rounded-lg p-2.5 sm:col-span-2">
            <div className="text-lux-muted mb-0.5">Sales Nav direct link</div>
            <a
              href={branding.sales_nav_direct_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lux-cyan break-all hover:underline"
            >
              {branding.sales_nav_direct_link}
            </a>
          </div>
        )}
        {branding.sales_nav_link_count != null && (
          <div className="bg-black/20 border border-white/[0.06] rounded-lg p-2.5">
            <div className="text-lux-muted mb-0.5">Sales Nav send count</div>
            <div className="text-lux-text font-medium tabular-nums">
              {branding.sales_nav_link_count.toLocaleString()}
            </div>
          </div>
        )}
        {branding.inmail_script && (
          <div className="bg-black/20 border border-white/[0.06] rounded-lg p-2.5 sm:col-span-2">
            <div className="text-lux-muted mb-0.5">InMail script</div>
            <div className="text-lux-text whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
              {branding.inmail_script}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
