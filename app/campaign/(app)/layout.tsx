import { redirect } from "next/navigation";
import CampaignSidebar from "@/components/campaign/CampaignSidebar";
import ProfilePhotoPrompt from "@/components/team/ProfilePhotoPrompt";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
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
    <div className="min-h-screen bg-lux-bg text-lux-text relative">
      <WorkspaceAmbient />
      <CampaignSidebar member={member} />
      <div className="lg:ml-[240px] min-h-screen flex flex-col relative">
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-[1400px] mx-auto w-full">
          {children}
        </main>
      </div>
      <ProfilePhotoPrompt member={member} />
    </div>
  );
}
