import { redirect } from "next/navigation";
import Sidebar from "@/components/team/Sidebar";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import LiveChatWidget from "@/components/team/LiveChatWidget";
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

  const [{ data: teamLeaders }, { count }, leaderChatRow] = await Promise.all([
    admin
      .from("team_members")
      .select("id, name, email")
      .eq("role", "team_leader")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null),
    isTeamLeader(member.role)
      ? admin.from("team_members").select("live_chat_agent").eq("id", member.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

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
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-[1200px] mx-auto w-full">{children}</main>
      </div>
      {chatMode && <LiveChatWidget mode={chatMode} agentEnabled={liveChatAgent} />}
    </div>
  );
}
