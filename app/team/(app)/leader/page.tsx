import { redirect } from "next/navigation";
import LeaderWorkspace from "@/components/team/LeaderWorkspace";
import { isTeamLeader } from "@/lib/roles";
import { getCurrentMember } from "@/lib/team";

export default async function LeaderPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/team/login");
  if (!isTeamLeader(member.role)) redirect("/team/hub");

  return <LeaderWorkspace />;
}
