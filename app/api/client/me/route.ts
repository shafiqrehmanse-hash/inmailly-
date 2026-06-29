import { NextResponse } from "next/server";
import { getCurrentClient, isTeamMemberUser } from "@/lib/client-auth-server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await getCurrentClient();
  if (client) {
    return NextResponse.json({ client: { id: client.id, name: client.name, email: client.email } });
  }

  const isTeam = await isTeamMemberUser(user.id);
  return NextResponse.json({
    error: isTeam ? "team_account" : "no_client",
  }, { status: 404 });
}
