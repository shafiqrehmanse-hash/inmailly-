import { NextResponse } from "next/server";
import { getLeaderAssignedWorkers } from "@/lib/team-leader-scope";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  try {
    const members = await getLeaderAssignedWorkers(leader.id);
    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        phone: m.phone,
        photo_url: m.photo_url,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load members" },
      { status: 500 }
    );
  }
}
