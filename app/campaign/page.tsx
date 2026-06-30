import { redirect } from "next/navigation";
import { isCampaignManager } from "@/lib/roles";
import { getCurrentMember } from "@/lib/team";

export default async function CampaignRootPage() {
  const member = await getCurrentMember();
  if (!member || !isCampaignManager(member.role)) redirect("/campaign/login");
  redirect("/campaign/hub");
}
