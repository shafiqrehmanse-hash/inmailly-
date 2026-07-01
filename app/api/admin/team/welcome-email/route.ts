import { NextRequest, NextResponse } from "next/server";
import { notifyTeamWelcomeVerified } from "@/lib/email";
import { teamWelcomeVerifiedEmail } from "@/lib/email-templates";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

/** Preview or send the post-verification team welcome email (dark HTML design). */
export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const firstName = request.nextUrl.searchParams.get("firstName")?.trim() || "Team";
  const html = teamWelcomeVerifiedEmail({ firstName });
  return NextResponse.json({
    html,
    subject: `Welcome to InMailly, ${firstName} — you're officially in ✦`,
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const normalized = email.trim().toLowerCase();

  const { data: member } = await admin
    .from("team_members")
    .select("id, name, email, user_id")
    .eq("email", normalized)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  }

  const result = await notifyTeamWelcomeVerified({
    name: member.name,
    email: member.email || normalized,
  });

  if (!result.ok && !result.skipped) {
    return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
  }

  if (member.user_id) {
    const { data: userData } = await admin.auth.admin.getUserById(member.user_id);
    const user = userData.user;
    if (user) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          welcome_email_sent: true,
        },
      });
    }
  }

  return NextResponse.json({
    success: true,
    sentTo: member.email,
    name: member.name,
    skipped: result.skipped || false,
  });
}
