import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLoginRedirect } from "@/lib/roles";
import { getCurrentClient } from "@/lib/client-auth-server";
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

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (member) {
    return NextResponse.json(
      { error: "team_account", role: member.role, redirect: getLoginRedirect(member.role) },
      { status: 404 }
    );
  }

  return NextResponse.json({ error: "no_client" }, { status: 404 });
}
