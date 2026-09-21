import { redirect } from "next/navigation";
import LeaderWorkspace from "@/components/team/LeaderWorkspace";
import { isTeamLeader } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/team";

export default async function LeaderPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/team/login");
  if (!isTeamLeader(member.role)) redirect("/team/hub");

  const admin = createAdminClient();
  const { data: flags } = await admin
    .from("team_members")
    .select("live_chat_agent, sales_nav_agent")
    .eq("id", member.id)
    .maybeSingle();

  return (
    <LeaderWorkspace
      leaderName={member.name}
      liveChatAgent={flags?.live_chat_agent === true}
      salesNavAgent={flags?.sales_nav_agent === true}
    />
  );
}
