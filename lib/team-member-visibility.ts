/** Member hidden from team roster / leaderboard (admin-only toggle). */
export function isHiddenFromTeam(member: { hidden_from_team?: boolean | null }): boolean {
  return member.hidden_from_team === true;
}

/** Keep visible members; hidden members only visible to themselves. */
export function memberVisibleToTeamViewer(
  member: { id: string; hidden_from_team?: boolean | null },
  viewerMemberId?: string | null
): boolean {
  if (!isHiddenFromTeam(member)) return true;
  return Boolean(viewerMemberId && member.id === viewerMemberId);
}

export function filterMembersVisibleToTeam<T extends { id: string; hidden_from_team?: boolean | null }>(
  members: T[],
  viewerMemberId?: string | null
): T[] {
  return members.filter((m) => memberVisibleToTeamViewer(m, viewerMemberId));
}
