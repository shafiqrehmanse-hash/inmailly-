import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectClientWorkspace from "@/components/team/ProjectClientWorkspace";
import { getCurrentMember } from "@/lib/team";
import { getMemberProject } from "@/lib/team-projects";

export default async function CampaignProjectPage({ params }: { params: { id: string } }) {
  const member = await getCurrentMember();
  if (!member) return null;

  const project = await getMemberProject(member.id, params.id);
  if (!project) notFound();

  const clientName = project.clients?.company_name || project.clients?.name || "Client";
  const portalUrl = project.portal_token
    ? `${process.env.NEXT_PUBLIC_SITE_URL || "https://inmailly.vercel.app"}/client/p/${project.portal_token}`
    : null;

  const scripts = [
    { label: "Connection request", text: project.connection_script },
    { label: "InMail", text: project.inmail_script },
    { label: "Follow-up", text: project.followup_script },
  ].filter((s) => s.text);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link href="/campaign/hub" className="text-sm text-lux-muted hover:text-lux-violet">
          ← Back to campaigns
        </Link>
        <p className="text-[0.65rem] uppercase tracking-widest text-lux-violet mt-4 mb-1">
          {clientName}
        </p>
        <h1 className="font-bricolage font-extrabold text-2xl text-lux-text">{project.name}</h1>
        <span className="inline-block mt-2 text-[0.65rem] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border border-lux-violet/30 bg-lux-violet/10 text-lux-violet capitalize">
          {project.status}
        </span>
      </div>

      {portalUrl && (
        <div className="lux-card p-5 border-lux-violet/20">
          <h2 className="font-bricolage font-bold text-lux-text mb-2">Client portal link</h2>
          <p className="text-sm text-lux-muted mb-3">
            Share this private link with your client — they see live responses you log below.
          </p>
          <code className="block text-xs text-lux-cyan bg-lux-bg2 border border-white/[0.06] rounded-lg px-3 py-2 break-all">
            {portalUrl}
          </code>
        </div>
      )}

      <ProjectClientWorkspace project={project} memberId={member.id} />

      <div className="lux-card p-5 sm:p-6 space-y-4">
        <h2 className="font-bricolage font-bold text-lux-text">Target audience</h2>
        {project.audience_brief ? (
          <p className="text-sm text-lux-muted leading-relaxed whitespace-pre-wrap">
            {project.audience_brief}
          </p>
        ) : (
          <p className="text-sm text-lux-muted/60 italic">Admin has not added a brief yet.</p>
        )}
        <div className="grid sm:grid-cols-3 gap-3 pt-2">
          {project.target_titles && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="text-[0.6rem] uppercase tracking-wider text-lux-muted mb-1">Titles</div>
              <div className="text-sm text-lux-text">{project.target_titles}</div>
            </div>
          )}
          {project.target_industries && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="text-[0.6rem] uppercase tracking-wider text-lux-muted mb-1">Industries</div>
              <div className="text-sm text-lux-text">{project.target_industries}</div>
            </div>
          )}
          {project.target_regions && (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
              <div className="text-[0.6rem] uppercase tracking-wider text-lux-muted mb-1">Regions</div>
              <div className="text-sm text-lux-text">{project.target_regions}</div>
            </div>
          )}
        </div>
      </div>

      {scripts.length > 0 && (
        <div className="lux-card p-5 sm:p-6 space-y-4">
          <h2 className="font-bricolage font-bold text-lux-text">Approved scripts</h2>
          {scripts.map((s) => (
            <div key={s.label}>
              <div className="text-[0.65rem] uppercase tracking-wider text-lux-violet mb-2">
                {s.label}
              </div>
              <div className="bg-lux-bg2 border border-white/[0.06] rounded-xl p-4 text-sm text-lux-muted whitespace-pre-wrap leading-relaxed">
                {s.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
