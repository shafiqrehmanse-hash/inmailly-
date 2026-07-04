import { NextResponse } from "next/server";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { computeTeamPerformance } from "@/lib/team-performance";

export async function GET() {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await computeTeamPerformance();
  return NextResponse.json({ ...data, currentMemberId: member.id });
}
