import { redirect } from "next/navigation";
import CampaignSidebar from "@/components/campaign/CampaignSidebar";
import { getCurrentMember } from "@/lib/team";
import { isCampaignManager } from "@/lib/roles";

export default async function CampaignAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();
  if (!member) redirect("/campaign/login");
  if (!isCampaignManager(member.role)) redirect("/team/hub");

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text">
      <CampaignSidebar member={member} />
      <div className="lg:ml-[220px] min-h-screen flex flex-col">
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
