import { redirect } from "next/navigation";
import Sidebar from "@/components/team/Sidebar";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  const supabase = createServerSupabase();
  const { count } = await supabase
    .from("outreach_links")
    .select("*", { count: "exact", head: true })
    .eq("status", "available")
    .is("member_id", null);

  return (
    <div className="min-h-screen bg-off">
      <Sidebar member={member} poolCount={count || 0} />
      <main className="lg:ml-[230px] min-h-screen p-6 pt-16 lg:pt-6">{children}</main>
    </div>
  );
}
