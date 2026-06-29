import type { TeamMember } from "@/lib/types";

export type MemberRole = TeamMember["role"];

export function isCampaignManager(role: string): boolean {
  return role === "campaign_manager";
}

export function isOutreachWorker(role: string): boolean {
  return role === "member" || role === "senior" || role === "admin";
}

export function getLoginRedirect(role: MemberRole): string {
  if (isCampaignManager(role)) return "/campaign/hub";
  return "/team/hub";
}
