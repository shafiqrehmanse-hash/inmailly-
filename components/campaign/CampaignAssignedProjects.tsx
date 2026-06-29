import Link from "next/link";
import type { AssignedProject } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  preview: "text-amber-300 border-amber-500/30 bg-amber-500/10",
  draft: "text-lux-muted border-white/[0.12] bg-white/[0.03]",
  paused: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  completed: "text-lux-cyan border-lux-cyan/30 bg-lux-cyan/10",
};

export default function CampaignAssignedProjects({
  projects,
}: {
  projects: AssignedProject[];
}) {
  if (projects.length === 0) {
    return (
      <section className="lux-card p-8 text-center">
        <div className="text-3xl mb-3 opacity-40">◎</div>
        <h2 className="font-bricolage font-extrabold text-lg text-lux-text mb-2">
          No campaigns assigned yet
        </h2>
        <p className="text-sm text-lux-muted max-w-md mx-auto">
          Admin will assign client projects here. You manage campaigns, log client responses, and
          share portal links — separate from outreach workers.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-widest text-lux-violet mb-1">
          Your campaigns
        </p>
        <h2 className="font-bricolage font-extrabold text-lg text-lux-text">
          Client projects ({projects.length})
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {projects.map((p) => {
          const clientLabel = p.clients?.company_name || p.clients?.name || "Client";
          const statusClass = STATUS_COLORS[p.status] || STATUS_COLORS.draft;

          return (
            <Link
              key={p.id}
              href={`/campaign/projects/${p.id}`}
              className="lux-card p-5 flex flex-col gap-3 min-h-[140px] hover:border-lux-violet/35 transition-all group border-lux-violet/15"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted truncate">
                    {clientLabel}
                  </div>
                  <div className="font-bricolage font-extrabold text-lux-text group-hover:text-lux-violet transition-colors truncate">
                    {p.name}
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[0.6rem] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusClass}`}
                >
                  {p.status}
                </span>
              </div>

              {p.audience_brief ? (
                <p className="text-[0.8rem] text-lux-muted leading-relaxed line-clamp-2 flex-1">
                  {p.audience_brief}
                </p>
              ) : (
                <p className="text-[0.8rem] text-lux-muted/60 italic flex-1">No brief yet</p>
              )}

              <span className="text-[0.72rem] font-bold text-lux-violet">Open campaign →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
