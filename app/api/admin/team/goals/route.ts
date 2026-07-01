import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { getWeekEndDate, getWeekStartDate } from "@/lib/week-goal";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate(weekStart);

  const [{ data: goal }, { count }] = await Promise.all([
    admin.from("team_weekly_goals").select("*").eq("week_start", weekStart).maybeSingle(),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("project_id", null)
      .gte("created_at", `${weekStart}T00:00:00.000Z`)
      .lt("created_at", weekEnd.toISOString()),
  ]);

  return NextResponse.json({
    weekStart,
    targetLeads: goal?.target_leads ?? 40,
    currentLeads: count || 0,
    goal: goal || null,
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetLeads } = await request.json();
  const target = parseInt(String(targetLeads), 10);
  if (!target || target < 1) {
    return NextResponse.json({ error: "targetLeads must be a positive number" }, { status: 400 });
  }

  const admin = createAdminClient();
  const weekStart = getWeekStartDate();

  const { data, error } = await admin
    .from("team_weekly_goals")
    .upsert(
      {
        week_start: weekStart,
        target_leads: target,
        set_by: "admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "week_start" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}
