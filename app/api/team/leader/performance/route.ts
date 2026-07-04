import { NextResponse } from "next/server";
import { computeTeamPerformance } from "@/lib/team-performance";
import { getLeaderAssignedWorkerIds } from "@/lib/team-leader-scope";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const assignedIds = new Set(await getLeaderAssignedWorkerIds(leader.id));
  const data = await computeTeamPerformance();
  const workers = data.members.filter((m) => assignedIds.has(m.id));

  return NextResponse.json({
    ...data,
    members: workers,
  });
}
