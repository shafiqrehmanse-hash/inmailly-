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
  const { data: row } = await admin
    .from("team_members")
    .select("live_chat_agent")
    .eq("id", member.id)
    .maybeSingle();

  const liveChatAgent = row?.live_chat_agent === true || member.live_chat_agent === true;

  return <LeaderWorkspace leaderName={member.name} liveChatAgent={liveChatAgent} />;
}
