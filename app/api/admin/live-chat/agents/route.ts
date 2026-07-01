import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: leaders } = await admin
    .from("team_members")
    .select("id, name, email, live_chat_agent, is_active")
    .eq("role", "team_leader")
    .order("name");

  return NextResponse.json({ leaders: leaders || [] });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaderId, liveChatAgent } = await request.json();
  if (!leaderId || typeof liveChatAgent !== "boolean") {
    return NextResponse.json({ error: "leaderId and liveChatAgent required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: leader } = await admin
    .from("team_members")
    .select("id, role")
    .eq("id", leaderId)
    .maybeSingle();

  if (!leader || leader.role !== "team_leader") {
    return NextResponse.json({ error: "Not a team leader" }, { status: 400 });
  }

  const { error } = await admin
    .from("team_members")
    .update({ live_chat_agent: liveChatAgent })
    .eq("id", leaderId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
