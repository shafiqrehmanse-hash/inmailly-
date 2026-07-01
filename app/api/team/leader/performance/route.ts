import { NextResponse } from "next/server";
import { computeTeamPerformance } from "@/lib/team-performance";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const data = await computeTeamPerformance();
  const workers = data.members.filter((m) => m.role !== "team_leader" || m.id === leader.id);
  return NextResponse.json({
    ...data,
    members: workers,
  });
}
