import Link from "next/link";
import CampaignAssignedProjects from "@/components/campaign/CampaignAssignedProjects";
import TeamContractHubCard from "@/components/team/TeamContractHubCard";
import { getCurrentMember } from "@/lib/team";
import { getMemberAssignedProjects } from "@/lib/team-projects";

export default async function CampaignHubPage() {
  const member = await getCurrentMember();
  if (!member) return null;

  const projects = await getMemberAssignedProjects(member.id);
  const active = projects.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-bricolage font-extrabold text-[clamp(1.5rem,4vw,2rem)] tracking-tight text-lux-text">
          Campaign dashboard
        </h1>
        <p className="text-lux-muted text-[0.92rem] mt-2 max-w-xl leading-relaxed">
          Welcome, {member.name}. Manage client campaigns, log responses for the client portal, and
          track project briefs — all in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lux-card p-4 text-center">
          <div className="font-bricolage font-extrabold text-2xl text-lux-text">{projects.length}</div>
          <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">Total campaigns</div>
        </div>
        <div className="lux-card p-4 text-center">
          <div className="font-bricolage font-extrabold text-2xl text-emerald-400">{active}</div>
          <div className="text-[0.65rem] uppercase tracking-wider text-lux-muted mt-1">Active</div>
        </div>
        <div className="lux-card p-4 text-center col-span-2 lg:col-span-2">
          <div className="text-[0.8rem] text-lux-muted leading-relaxed">
            Run marketing outreach under{" "}
            <Link href="/campaign/outreach" className="text-lux-cyan font-semibold hover:underline">
              InMailly outreach
            </Link>
            . Manage client projects below — your permanent campaign department, separate from team leaders.
          </div>
        </div>
      </div>

      <TeamContractHubCard contractHref="/campaign/contract" />

      <CampaignAssignedProjects projects={projects} />
    </div>
  );
}
