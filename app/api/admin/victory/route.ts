import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { publishVictoryAnnouncement, type VictoryKind } from "@/lib/team-victory";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("team_victory_announcements")
    .select("*")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ announcements: data || [] });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const kind = body.kind as VictoryKind;
  if (!["custom", "birthday"].includes(kind)) {
    return NextResponse.json({ error: "kind must be custom or birthday" }, { status: 400 });
  }

  const memberName = String(body.member_name || "").trim();
  if (!memberName) {
    return NextResponse.json({ error: "member_name required" }, { status: 400 });
  }

  const hours = Math.min(168, Math.max(1, Number(body.hours) || 24));

  await publishVictoryAnnouncement({
    kind,
    memberId: body.member_id || null,
    memberName,
    message: body.message?.trim() || null,
    hours,
  });

  return NextResponse.json({ success: true });
}
