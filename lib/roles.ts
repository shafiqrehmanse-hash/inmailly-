import type { TeamMember } from "@/lib/types";

/** Roles that claim links, log leads, and do daily outreach. */
export type MemberRole = TeamMember["role"];

export function isCampaignManager(role: string): boolean {
  return role === "campaign_manager";
}

export function isTeamLeader(role: string): boolean {
  return role === "team_leader";
}

/** Outreach team (includes team leaders who also work links). Excludes campaign managers only. */
export function isOutreachWorker(role: string): boolean {
  return role === "member" || role === "senior" || role === "admin" || role === "team_leader";
}

/** Workers a team leader can assign tasks to (not other leaders). */
export function isLeaderAssignableWorker(role: string): boolean {
  return role === "member" || role === "senior" || role === "admin";
}

/** Outreach members who can open live chat (not team leaders or campaign managers). */
export function canOpenLiveChat(role: string): boolean {
  return isLeaderAssignableWorker(role);
}

export function getLoginRedirect(role: MemberRole): string {
  if (isCampaignManager(role)) return "/campaign/hub";
  return "/team/hub";
}

export function roleLabel(role: string): string {
  if (isTeamLeader(role)) return "Team leader";
  if (isCampaignManager(role)) return "Campaign manager";
  if (role === "admin") return "Team admin";
  if (role === "senior") return "Senior worker";
  return "Outreach worker";
}
