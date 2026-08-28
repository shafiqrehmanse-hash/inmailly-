import { NextResponse } from "next/server";
import { sendTeamMemberPasswordReset } from "@/lib/team-password-reset";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await sendTeamMemberPasswordReset(email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      message: "If that email is on the team, we sent a reset link. Check inbox and spam.",
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
