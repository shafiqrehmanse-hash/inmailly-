import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekEndDate, getWeekStartDate } from "@/lib/week-goal";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

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

  const targetLeads = goal?.target_leads ?? 40;
  const currentLeads = count || 0;
  const pct = Math.min(100, Math.round((currentLeads / targetLeads) * 100));

  return NextResponse.json({
    weekStart,
    targetLeads,
    currentLeads,
    pct,
    hasCustomGoal: Boolean(goal),
  });
}
