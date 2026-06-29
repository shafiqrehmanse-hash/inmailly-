import { redirect } from "next/navigation";
import DailyScriptBar from "@/components/team/DailyScriptBar";
import Sidebar from "@/components/team/Sidebar";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";
import { getTeamScriptsPayload } from "@/lib/team-scripts-server";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = createServerSupabase();
  const [{ count }, scripts] = await Promise.all([
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null),
    getTeamScriptsPayload(),
  ]);

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Sidebar member={member} poolCount={count || 0} />
      <div className="lg:ml-[240px] min-h-screen flex flex-col">
        <DailyScriptBar scripts={scripts} />
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-6xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
