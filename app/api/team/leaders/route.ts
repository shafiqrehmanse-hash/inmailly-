import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/team";
import { isTeamLeader } from "@/lib/roles";
import { getLeadersForWorker } from "@/lib/team-leader-scope";

/** Workers only see their assigned team leader — not every leader in the company. */
export async function GET() {
  const member = await getCurrentMember();
  if (!member?.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isTeamLeader(member.role)) {
    return NextResponse.json({ leaders: [] });
  }

  const leaders = await getLeadersForWorker(member.id);
  return NextResponse.json({
    leaders: leaders.map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      role: "team_leader",
    })),
  });
}
