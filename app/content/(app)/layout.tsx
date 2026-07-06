import { redirect } from "next/navigation";
import ContentSidebar from "@/components/content/ContentSidebar";
import ProfilePhotoPrompt from "@/components/team/ProfilePhotoPrompt";
import WorkspaceAmbient from "@/components/ui/WorkspaceAmbient";
import { getContentManagerMember } from "@/lib/content-auth-server";

export default async function ContentAppLayout({ children }: { children: React.ReactNode }) {
  const member = await getContentManagerMember();
  if (!member) redirect("/content/login");

  return (
    <div className="min-h-screen bg-lux-bg text-lux-text relative">
      <WorkspaceAmbient />
      <ContentSidebar member={member} />
      <div className="lg:ml-[240px] min-h-screen flex flex-col relative">
        <main className="flex-1 p-5 sm:p-6 pt-14 lg:pt-6 max-w-[1100px] mx-auto w-full">{children}</main>
      </div>
      <ProfilePhotoPrompt member={member} />
    </div>
  );
}
