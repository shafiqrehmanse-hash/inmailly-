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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [todayEvents, weekEvents, recentRes] = await Promise.all([
    admin
      .from("link_auto_assign_events")
      .select("assigned_count")
      .gte("created_at", today.toISOString()),
    admin
      .from("link_auto_assign_events")
      .select("assigned_count, member_id")
      .gte("created_at", weekAgo.toISOString()),
    admin
      .from("link_auto_assign_events")
      .select("id, member_id, assigned_count, active_before, active_after, pool_remaining, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const membersRes = await admin.from("team_members").select("id, name");
  const nameMap = new Map((membersRes.data || []).map((m) => [m.id, m.name]));

  const linksToday = (todayEvents.data || []).reduce((s, e) => s + e.assigned_count, 0);
  const batchesToday = todayEvents.data?.length || 0;
  const linksWeek = (weekEvents.data || []).reduce((s, e) => s + e.assigned_count, 0);

  const byMemberWeek: Record<string, number> = {};
  for (const e of weekEvents.data || []) {
    byMemberWeek[e.member_id] = (byMemberWeek[e.member_id] || 0) + e.assigned_count;
  }

  const recent = (recentRes.data || []).map((e) => ({
    ...e,
    memberName: nameMap.get(e.member_id) || "Unknown",
  }));

  return NextResponse.json({
    linksToday,
    batchesToday,
    linksWeek,
    byMemberWeek,
    recent,
  });
}
