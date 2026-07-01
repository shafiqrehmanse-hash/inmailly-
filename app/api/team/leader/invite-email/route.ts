import { NextRequest, NextResponse } from "next/server";
import { sendEmailSafe } from "@/lib/email";
import { teamInviteProspectEmail } from "@/lib/email-templates";
import { getSiteUrl } from "@/lib/site-url";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamLeader } from "@/lib/roles";

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member || !member.is_active || !isTeamLeader(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, inviteCode, note } = await request.json();
  if (!email?.trim() || !inviteCode?.trim()) {
    return NextResponse.json({ error: "email and inviteCode required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const code = inviteCode.trim().toUpperCase();
  const { data: codeRow } = await admin
    .from("invite_codes")
    .select("id, uses_left, created_by_member_id")
    .eq("code", code)
    .maybeSingle();

  if (!codeRow || codeRow.created_by_member_id !== member.id) {
    return NextResponse.json({ error: "Invite code not found or not yours" }, { status: 404 });
  }
  if ((codeRow.uses_left || 0) < 1) {
    return NextResponse.json({ error: "This invite code has no uses left" }, { status: 400 });
  }

  const site = getSiteUrl();
  const registerUrl = `${site}/team/register?code=${encodeURIComponent(code)}`;
  const html = teamInviteProspectEmail({
    inviteCode: code,
    leaderName: member.name,
    registerUrl,
    personalNote: note,
  });

  const result = await sendEmailSafe({
    to: email.trim().toLowerCase(),
    subject: `${member.name} invited you to join InMailly`,
    html,
    text: `You're invited to join InMailly. Code: ${code}. Register: ${registerUrl}`,
  });

  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: result.error || "Failed to send" }, { status: 500 });
  }

  return NextResponse.json({ success: true, sentTo: email.trim().toLowerCase(), skipped: result.skipped || false });
}
