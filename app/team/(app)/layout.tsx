import { redirect } from "next/navigation";
import Sidebar from "@/components/team/Sidebar";
import { isCampaignManager } from "@/lib/roles";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";
import "../team-theme.css";

export default async function TeamAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/team/login");
  if (isCampaignManager(member.role)) redirect("/campaign/hub");

  const supabase = createServerSupabase();
  const { count } = await supabase
    .from("outreach_links")
    .select("*", { count: "exact", head: true })
    .eq("status", "available")
    .is("member_id", null);

  return (
    <div className="team-workspace min-h-screen">
      <div className="team-workspace-bg-glow" aria-hidden />
      <div className="team-workspace-inner min-h-screen flex">
        <Sidebar member={member} poolCount={count || 0} />
        <div className="lg:ml-[248px] flex-1 flex flex-col min-h-screen w-full">
          <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-8 max-w-[1200px] mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
