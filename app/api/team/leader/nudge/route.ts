import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { emailLayout } from "@/lib/email-templates";
import { NUDGE_TEMPLATES, nudgeHtmlBody, type NudgeTemplateKey } from "@/lib/leader-nudges";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeTeamPerformance } from "@/lib/team-performance";
import { isLeaderAssignableWorker } from "@/lib/roles";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function POST(request: NextRequest) {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const { memberId, template } = await request.json();
  if (!memberId || !template || !(template in NUDGE_TEMPLATES)) {
    return NextResponse.json({ error: "memberId and valid template required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("team_members")
    .select("id, name, email, role, is_active, leader_id")
    .eq("id", memberId)
    .maybeSingle();

  if (
    !target?.is_active ||
    !isLeaderAssignableWorker(target.role) ||
    target.leader_id !== leader.id
  ) {
    return NextResponse.json({ error: "Member is not on your assigned team" }, { status: 400 });
  }

  const perf = await computeTeamPerformance();
  const memberPerf = perf.members.find((m) => m.id === target.id);
  const tpl = NUDGE_TEMPLATES[template as NudgeTemplateKey];
  const body = tpl.buildBody({
    leaderName: leader.name,
    memberName: target.name,
    staleCount: memberPerf?.staleClaimed || 0,
    poolCount: perf.totals.poolAvailable,
  });

  const send = await sendEmail({
    to: target.email,
    subject: tpl.subject,
    html: emailLayout({
      eyebrow: "Team reminder",
      title: tpl.subject,
      bodyHtml: nudgeHtmlBody(body),
      footerNote: `Sent by ${leader.name}, your team leader at InMailly.`,
    }),
    text: body,
  });

  if (!send.ok && !send.skipped) {
    return NextResponse.json({ error: send.error || "Failed to send" }, { status: 500 });
  }

  await admin.from("leader_nudge_events").insert({
    sent_by_member_id: leader.id,
    target_member_id: target.id,
    template_key: template,
  });

  return NextResponse.json({
    ok: true,
    skipped: send.skipped,
    sentTo: target.email,
  });
}
