import Link from "next/link";
import type { AssignedProject } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  draft: "text-lux-muted border-white/[0.12] bg-white/[0.03]",
  paused: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  completed: "text-lux-cyan border-lux-cyan/30 bg-lux-cyan/10",
};

export default function TeamAssignedProjects({ projects }: { projects: AssignedProject[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-widest text-lux-cyan mb-1">
            Your assigned projects
          </p>
          <h2 className="font-bricolage font-extrabold text-lg text-lux-text">
            Client campaigns ({projects.length})
          </h2>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {projects.map((p) => {
          const clientLabel = p.clients?.company_name || p.clients?.name || "Client";
          const statusClass = STATUS_COLORS[p.status] || STATUS_COLORS.draft;

          return (
            <Link
              key={p.id}
              href={`/team/projects/${p.id}`}
              className="lux-card p-5 flex flex-col gap-3 min-h-[140px] hover:border-lux-cyan/35 transition-all group border-lux-blue/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted truncate">
                    {clientLabel}
                  </div>
                  <div className="font-bricolage font-extrabold text-lux-text group-hover:text-lux-cyan transition-colors truncate">
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
                <p className="text-[0.8rem] text-lux-muted/60 italic flex-1">No brief yet — open for details</p>
              )}

              <div className="flex flex-wrap gap-2 text-[0.65rem] text-lux-muted">
                {p.target_titles && <span>🎯 {p.target_titles}</span>}
                {p.target_regions && <span>🌍 {p.target_regions}</span>}
              </div>

              <span className="text-[0.72rem] font-bold text-lux-cyan">Open project →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
