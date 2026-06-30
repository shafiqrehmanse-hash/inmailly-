import { redirect } from "next/navigation";
import DailyScriptBar from "@/components/team/DailyScriptBar";
import Sidebar from "@/components/team/Sidebar";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import { isCampaignManager } from "@/lib/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";
import { getTeamScriptsPayload } from "@/lib/team-scripts-server";

export default async function TeamAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/team/login");
  if (isCampaignManager(member.role)) redirect("/campaign/hub");

  const supabase = createServerSupabase();
  const [poolRes, scripts] = await Promise.all([
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null),
    getTeamScriptsPayload(),
  ]);

  const poolCount = poolRes.count || 0;

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text relative">
      <WorkspaceAmbient />
      <Sidebar member={member} poolCount={poolCount} />
      <div className="lg:ml-[240px] min-h-screen flex flex-col relative">
        <DailyScriptBar scripts={scripts} />
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-[1200px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
