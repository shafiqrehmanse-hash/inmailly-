import { redirect } from "next/navigation";
import Sidebar from "@/components/team/Sidebar";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import { isCampaignManager } from "@/lib/roles";
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

  const supabase = createServerSupabase();
  const { count } = await supabase
    .from("outreach_links")
    .select("*", { count: "exact", head: true })
    .eq("status", "available")
    .is("member_id", null);

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text relative">
      <WorkspaceAmbient />
      <Sidebar member={member} poolCount={count || 0} />
      <div className="lg:ml-[240px] min-h-screen flex flex-col relative">
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-[1200px] mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
