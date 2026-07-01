import { createAdminClient } from "@/lib/supabase/admin";
import { getWeekEndDate, getWeekStartDate } from "@/lib/week-goal";

export default async function TeamWeeklyGoalBar() {
  const admin = createAdminClient();
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate(weekStart);

  const [{ data: goal }, { count }] = await Promise.all([
    admin.from("team_weekly_goals").select("target_leads").eq("week_start", weekStart).maybeSingle(),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("project_id", null)
      .gte("created_at", `${weekStart}T00:00:00.000Z`)
      .lt("created_at", weekEnd.toISOString()),
  ]);

  const target = goal?.target_leads ?? 40;
  const current = count || 0;
  const pct = Math.min(100, Math.round((current / target) * 100));

  return (
    <div className="lux-card-elite p-4 sm:p-5 border-lux-cyan/15">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-[0.62rem] font-bold uppercase tracking-widest text-lux-cyan">Weekly team goal</p>
        <span className="text-sm font-bold text-lux-text tabular-nums">
          {current} / {target} leads <span className="text-lux-cyan">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lux-violet to-lux-cyan transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
