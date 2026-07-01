import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("team_focus_announcements")
    .select("*")
    .eq("created_by_member_id", leader.id)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ focus: data || null });
}

export async function POST(request: NextRequest) {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const { message, days } = await request.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const durationDays = Math.min(14, Math.max(1, Number(days) || 7));
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_focus_announcements")
    .insert({
      message: message.trim(),
      created_by_member_id: leader.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ focus: data });
}

export async function DELETE() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("team_focus_announcements")
    .update({ expires_at: now })
    .eq("created_by_member_id", leader.id)
    .gt("expires_at", now);

  return NextResponse.json({ success: true });
}
