import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Active team focus banner for all signed-in members. */
export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from("team_focus_announcements")
    .select("id, message, expires_at, created_at, created_by_member_id")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ focus: null });

  const { data: author } = await admin
    .from("team_members")
    .select("name")
    .eq("id", data.created_by_member_id)
    .maybeSingle();

  return NextResponse.json({
    focus: {
      id: data.id,
      message: data.message,
      expiresAt: data.expires_at,
      authorName: author?.name || "Team leader",
    },
  });
}
