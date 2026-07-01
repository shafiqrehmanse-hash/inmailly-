import { NextResponse } from "next/server";
import { isTeamLeader } from "@/lib/roles";
import { getCurrentMember } from "@/lib/team";
import type { TeamMember } from "@/lib/types";

export async function requireTeamLeader(): Promise<TeamMember | NextResponse> {
  const member = await getCurrentMember();
  if (!member || !member.is_active || !isTeamLeader(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return member;
}

export function isLeaderResponse(result: TeamMember | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
