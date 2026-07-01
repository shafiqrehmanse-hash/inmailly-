import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { teamBroadcastHtmlBody, teamBroadcastPlainBody } from "@/lib/admin-email-signature";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message, member_ids, send_to_all } = await request.json();
  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  let query = admin.from("team_members").select("id, name, email").eq("is_active", true);
  if (!send_to_all && Array.isArray(member_ids) && member_ids.length > 0) {
    query = query.in("id", member_ids);
  }
  const { data: members, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!members?.length) return NextResponse.json({ error: "No members to email" }, { status: 400 });

  let sent = 0;
  const failures: string[] = [];

  for (const m of members) {
    if (!m.email) continue;
    const result = await sendEmail({
      to: m.email,
      subject: subject.trim(),
      text: teamBroadcastPlainBody(message, subject),
      html: teamBroadcastHtmlBody(message, subject),
    });
    if (result.ok) sent += 1;
    else failures.push(m.name);
  }

  return NextResponse.json({
    success: true,
    sent,
    total: members.length,
    failures,
    configured: Boolean(process.env.RESEND_API_KEY),
  });
}
