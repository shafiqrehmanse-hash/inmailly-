import { redirect } from "next/navigation";
import TeamVictoryBanner from "@/components/team/TeamVictoryBanner";
import Sidebar from "@/components/team/Sidebar";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import LiveChatWidget from "@/components/team/LiveChatWidget";
import ProfilePhotoPrompt from "@/components/team/ProfilePhotoPrompt";
import { canOpenLiveChat, isCampaignManager, isTeamLeader } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";

export default async function TeamAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/team/login");
  if (isCampaignManager(member.role)) redirect("/campaign/hub");

  const admin = createAdminClient();
  const supabase = createServerSupabase();

  const [{ data: assignedLeader }, { count }, leaderChatRow] = await Promise.all([
    !isTeamLeader(member.role) && member.leader_id
      ? admin
          .from("team_members")
          .select("id, name, email")
          .eq("id", member.leader_id)
          .eq("role", "team_leader")
          .eq("is_active", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null),
    isTeamLeader(member.role)
      ? admin.from("team_members").select("live_chat_agent").eq("id", member.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const teamLeaders = assignedLeader ? [assignedLeader] : [];

  let liveChatAgent = member.live_chat_agent === true;
  if (isTeamLeader(member.role) && leaderChatRow?.data) {
    liveChatAgent = leaderChatRow.data.live_chat_agent === true;
  }

  const chatMode = canOpenLiveChat(member.role)
    ? ("member" as const)
    : isTeamLeader(member.role)
      ? ("leader" as const)
      : null;

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text relative">
      <WorkspaceAmbient />
      <Sidebar
        member={member}
        poolCount={count || 0}
        teamLeaders={teamLeaders || []}
        showLiveChat={!!chatMode}
        liveChatLabel={chatMode === "leader" ? "Live chat inbox" : "Live support"}
      />
      <div className="lg:ml-[240px] min-h-screen flex flex-col relative">
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-[1200px] mx-auto w-full">
          <TeamVictoryBanner />
          {children}
        </main>
      </div>
      {chatMode && <LiveChatWidget mode={chatMode} agentEnabled={liveChatAgent} />}
      <ProfilePhotoPrompt member={member} />
    </div>
  );
}
