import { NextRequest, NextResponse } from "next/server";
import { handlePostEmailVerification } from "@/lib/post-verification";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

/** Admin: resend welcome + verified alert for a team member who missed them. */
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
    .select("user_id, name, email")
    .eq("email", normalized)
    .maybeSingle();

  if (!member?.user_id) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  }

  const { data: userData } = await admin.auth.admin.getUserById(member.user_id);
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Auth user not found" }, { status: 404 });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "This member has not verified their email yet" }, { status: 400 });
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata || {}),
      welcome_email_sent: false,
      admin_verified_notify_sent: false,
    },
  });

  await handlePostEmailVerification({
    ...user,
    user_metadata: {
      ...(user.user_metadata || {}),
      welcome_email_sent: false,
      admin_verified_notify_sent: false,
    },
  });

  return NextResponse.json({
    success: true,
    sentTo: member.email,
    name: member.name,
  });
}
