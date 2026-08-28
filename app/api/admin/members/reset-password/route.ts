import { NextRequest, NextResponse } from "next/server";
import { sendTeamMemberPasswordReset } from "@/lib/team-password-reset";
import { verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { email } = await request.json();
  if (!email?.trim()) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const result = await sendTeamMemberPasswordReset(email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (!result.sent) {
    return NextResponse.json({ error: "No team login found for that email" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
