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

/** Outreach roles visible in team-leader pulse, email, assign (never campaign managers). */
export const LEADER_MANAGED_ROLES = ["member", "senior", "admin"] as const;

/** Roles included in team performance aggregates (excludes campaign managers). */
export const OUTREACH_REPORTING_ROLES = ["member", "senior", "admin", "team_leader"] as const;

/** Workers a team leader can assign tasks to (not other leaders or campaign managers). */
export function isLeaderAssignableWorker(role: string): boolean {
  return (LEADER_MANAGED_ROLES as readonly string[]).includes(role);
}

/** Campaign managers are a separate department — never shown to team leaders. */
export function isHiddenFromTeamLeader(role: string): boolean {
  return isCampaignManager(role);
}

/** Outreach tools: outreach team + campaign managers (own outreach tab, no team leaders). */
export function canUseOutreachTools(role: string): boolean {
  return isOutreachWorker(role) || isCampaignManager(role);
}

/** Outreach members who can open live chat (not team leaders or campaign managers). */
export function canOpenLiveChat(role: string): boolean {
  return isLeaderAssignableWorker(role);
}

export function getLoginRedirect(role: MemberRole): string {
  if (isCampaignManager(role)) return "/campaign/hub";
  return "/team/hub";
}

/** Where employment contracts are signed in the dashboard for each role. */
export function getContractDashboardPath(role: string): string {
  if (isCampaignManager(role)) return "/campaign/contract";
  return "/team/contract";
}

export function roleLabel(role: string): string {
  if (isTeamLeader(role)) return "Team leader";
  if (isCampaignManager(role)) return "Campaign manager";
  if (role === "admin") return "Team admin";
  if (role === "senior") return "Senior worker";
  return "Outreach worker";
}
