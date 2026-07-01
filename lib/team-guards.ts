import { redirect } from "next/navigation";
import { isCampaignManager, isTeamLeader } from "@/lib/roles";
import { getCurrentMember } from "@/lib/team";
import type { TeamMember } from "@/lib/types";

/** Pages for link claiming, leads, scripts — not for team leaders. */
export async function requireOutreachWorker(): Promise<TeamMember> {
  const member = await getCurrentMember();
  if (!member) redirect("/team/login");
  if (isCampaignManager(member.role)) redirect("/campaign/hub");
  if (isTeamLeader(member.role)) redirect("/team/leader");
  return member;
}
