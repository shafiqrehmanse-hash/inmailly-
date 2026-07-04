import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { leaderBroadcastSignature, teamBroadcastHtmlBody, teamBroadcastPlainBody } from "@/lib/admin-email-signature";
import { getLeaderAssignedWorkers } from "@/lib/team-leader-scope";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function POST(request: Request) {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const { subject, message, member_ids, send_to_all } = await request.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const assigned = await getLeaderAssignedWorkers(leader.id);
  let targets = assigned;

  if (!send_to_all && Array.isArray(member_ids) && member_ids.length > 0) {
    const allowed = new Set(assigned.map((m) => m.id));
    targets = assigned.filter((m) => member_ids.includes(m.id) && allowed.has(m.id));
  }

  if (!targets.length) {
    return NextResponse.json(
      { error: "No assigned team members to email. Ask admin to assign workers to you." },
      { status: 400 }
    );
  }

  const signature = leaderBroadcastSignature(leader.name);
  let sent = 0;
  const failures: string[] = [];

  for (const m of targets) {
    if (!m.email) continue;
    const result = await sendEmail({
      to: m.email,
      subject: subject.trim(),
      replyTo: leader.email,
      text: teamBroadcastPlainBody(message, subject, signature),
      html: teamBroadcastHtmlBody(message, subject, signature),
    });
    if (result.ok) sent += 1;
    else failures.push(m.name);
  }

  return NextResponse.json({
    success: true,
    sent,
    total: targets.length,
    failures,
    configured: Boolean(process.env.RESEND_API_KEY),
  });
}
