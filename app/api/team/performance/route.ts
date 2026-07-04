import { NextResponse } from "next/server";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { computeTeamPerformance } from "@/lib/team-performance";

export async function GET() {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Global leaderboard for everyone (workers + team leaders).
  // Leaders still cannot act on non-assigned members via leader APIs.
  const data = await computeTeamPerformance();
  return NextResponse.json({
    ...data,
    currentMemberId: member.id,
    scope: "global",
  });
}
