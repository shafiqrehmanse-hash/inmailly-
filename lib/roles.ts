import type { TeamMember } from "@/lib/types";

/** Roles that claim links, log leads, and do daily outreach. */
export type MemberRole = TeamMember["role"];

export function isCampaignManager(role: string): boolean {
  return role === "campaign_manager";
}

export function isTeamLeader(role: string): boolean {
  return role === "team_leader";
}

/** Outreach workers only — not team leaders or campaign managers. */
export function isOutreachWorker(role: string): boolean {
  return role === "member" || role === "senior" || role === "admin";
}

export function getLoginRedirect(role: MemberRole): string {
  if (isCampaignManager(role)) return "/campaign/hub";
  if (isTeamLeader(role)) return "/team/leader";
  return "/team/hub";
}

export function roleLabel(role: string): string {
  if (isTeamLeader(role)) return "Team leader";
  if (isCampaignManager(role)) return "Campaign manager";
  if (role === "admin") return "Team admin";
  if (role === "senior") return "Senior worker";
  return "Outreach worker";
}
