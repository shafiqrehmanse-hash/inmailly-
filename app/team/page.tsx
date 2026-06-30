import { redirect } from "next/navigation";
import { getLoginRedirect, isCampaignManager } from "@/lib/roles";
import { getCurrentMember } from "@/lib/team";

export default async function TeamRootPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/team/login");
  if (isCampaignManager(member.role)) redirect("/campaign/hub");
  redirect(getLoginRedirect(member.role));
}
