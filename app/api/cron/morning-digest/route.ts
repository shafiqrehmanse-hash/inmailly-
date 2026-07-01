import { NextRequest, NextResponse } from "next/server";
import { getNotifyEmail, sendEmail } from "@/lib/email";
import { morningDigestHtml, morningDigestPlain, morningDigestSubject } from "@/lib/morning-digest";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeTeamPerformance } from "@/lib/team-performance";
import { getWeekEndDate, getWeekStartDate } from "@/lib/week-goal";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const perf = await computeTeamPerformance();
  const weekStart = getWeekStartDate();
  const weekEnd = getWeekEndDate(weekStart);
  const now = new Date().toISOString();

  const [{ data: goal }, { count: weekLeads }, { data: focus }, { data: leaders }] = await Promise.all([
    admin.from("team_weekly_goals").select("*").eq("week_start", weekStart).maybeSingle(),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("project_id", null)
      .gte("created_at", `${weekStart}T00:00:00.000Z`)
      .lt("created_at", weekEnd.toISOString()),
    admin
      .from("team_focus_announcements")
      .select("message")
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("team_members")
      .select("email")
      .eq("role", "team_leader")
      .eq("is_active", true),
  ]);

  const digestGoal = {
    targetLeads: goal?.target_leads ?? 40,
    currentLeads: weekLeads || 0,
    weekStart,
  };

  const subject = morningDigestSubject();
  const html = morningDigestHtml(perf, digestGoal, focus?.message || null);
  const text = morningDigestPlain(perf, digestGoal, focus?.message || null);

  const recipients = new Set<string>();
  recipients.add(getNotifyEmail());
  for (const l of leaders || []) {
    if (l.email) recipients.add(l.email);
  }

  const results: { email: string; ok: boolean; skipped?: boolean }[] = [];
  for (const email of Array.from(recipients)) {
    const send = await sendEmail({ to: email, subject, html, text });
    results.push({ email, ok: send.ok, skipped: send.skipped });
  }

  return NextResponse.json({
    sent: results.filter((r) => r.ok).length,
    recipients: results.length,
    results,
    generatedAt: new Date().toISOString(),
  });
}
