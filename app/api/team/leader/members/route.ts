import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamLeader } from "@/lib/roles";

export async function GET() {
  const member = await getCurrentMember();
  if (!member || !member.is_active || !isTeamLeader(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: members } = await admin
    .from("team_members")
    .select("id, name, email, role")
    .eq("is_active", true)
    .neq("role", "campaign_manager")
    .order("name");

  return NextResponse.json({ members: members || [] });
}
