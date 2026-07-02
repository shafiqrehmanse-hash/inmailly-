import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { leaderBroadcastSignature, teamBroadcastHtmlBody, teamBroadcastPlainBody } from "@/lib/admin-email-signature";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamLeader, LEADER_MANAGED_ROLES } from "@/lib/roles";

export async function POST(request: Request) {
  const member = await getCurrentMember();
  if (!member || !member.is_active || !isTeamLeader(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message, member_ids, send_to_all } = await request.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin
    .from("team_members")
    .select("id, name, email, role")
    .eq("is_active", true)
    .in("role", [...LEADER_MANAGED_ROLES])
    .neq("id", member.id);

  if (!send_to_all && Array.isArray(member_ids) && member_ids.length > 0) {
    query = query.in("id", member_ids);
  }

  const { data: members, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!members?.length) {
    return NextResponse.json({ error: "No outreach members to email" }, { status: 400 });
  }

  const outreachOnly = members.filter((m) => m.role !== "team_leader");
  if (!outreachOnly.length) {
    return NextResponse.json({ error: "No outreach members to email" }, { status: 400 });
  }

  const signature = leaderBroadcastSignature(member.name);
  let sent = 0;
  const failures: string[] = [];

  for (const m of outreachOnly) {
    if (!m.email) continue;
    const result = await sendEmail({
      to: m.email,
      subject: subject.trim(),
      replyTo: member.email,
      text: teamBroadcastPlainBody(message, subject, signature),
      html: teamBroadcastHtmlBody(message, subject, signature),
    });
    if (result.ok) sent += 1;
    else failures.push(m.name);
  }

  return NextResponse.json({
    success: true,
    sent,
    total: outreachOnly.length,
    failures,
    configured: Boolean(process.env.RESEND_API_KEY),
  });
}
