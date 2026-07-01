import { NextResponse } from "next/server";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

/** Active team leaders — visible to all signed-in team members. */
export async function GET() {
  const member = await getCurrentMember();
  if (!member?.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: leaders } = await admin
    .from("team_members")
    .select("id, name, email, role")
    .eq("role", "team_leader")
    .eq("is_active", true)
    .order("name");

  return NextResponse.json({ leaders: leaders || [] });
}
