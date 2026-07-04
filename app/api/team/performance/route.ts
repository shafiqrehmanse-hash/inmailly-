import { NextResponse } from "next/server";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { isTeamLeader } from "@/lib/roles";
import { getLeaderAssignedWorkerIds } from "@/lib/team-leader-scope";
import { computeTeamPerformance } from "@/lib/team-performance";

export async function GET() {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await computeTeamPerformance();

  // Team leaders only see performance for workers assigned to them — not the full company board.
  if (isTeamLeader(member.role)) {
    const assignedIds = new Set(await getLeaderAssignedWorkerIds(member.id));
    const members = data.members
      .filter((m) => assignedIds.has(m.id))
      .map((m, i) => ({ ...m, rank: i + 1 }));

    const totals = members.reduce(
      (s, m) => ({
        claimed: s.claimed + m.claimed,
        used: s.used + m.used,
        usedToday: s.usedToday + m.usedToday,
        leads: s.leads + m.leads,
        leadsToday: s.leadsToday + m.leadsToday,
        leadsWeek: s.leadsWeek + m.leadsWeek,
        dealsClosed: s.dealsClosed + m.dealsClosed,
        referralsJoined: s.referralsJoined + m.referralsJoined,
        inactive: s.inactive + (m.inactive24h ? 1 : 0),
        needsAttention: s.needsAttention + (m.needsAttention ? 1 : 0),
      }),
      {
        claimed: 0,
        used: 0,
        usedToday: 0,
        leads: 0,
        leadsToday: 0,
        leadsWeek: 0,
        dealsClosed: 0,
        referralsJoined: 0,
        inactive: 0,
        needsAttention: 0,
      }
    );

    return NextResponse.json({
      ...data,
      members,
      totals: {
        ...data.totals,
        ...totals,
        poolAvailable: data.totals.poolAvailable,
        autoAssignLinksToday: data.totals.autoAssignLinksToday,
        autoAssignBatchesToday: data.totals.autoAssignBatchesToday,
      },
      currentMemberId: member.id,
      scope: "assigned_team",
    });
  }

  return NextResponse.json({
    ...data,
    currentMemberId: member.id,
    scope: "global",
  });
}
