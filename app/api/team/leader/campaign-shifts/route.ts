import { NextResponse } from "next/server";
import { listShiftsForDate } from "@/lib/campaign-shifts";
import { getLeaderAssignedWorkerIds } from "@/lib/team-leader-scope";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  try {
    const assigned = new Set(await getLeaderAssignedWorkerIds(leader.id));
    const shifts = (await listShiftsForDate()).filter((s) => assigned.has(s.member_id));
    return NextResponse.json({ shifts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load shifts";
    if (message.includes("member_campaign_shifts")) {
      return NextResponse.json({ shifts: [] });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
