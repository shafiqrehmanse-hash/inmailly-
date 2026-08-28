import { NextResponse } from "next/server";
import { heartbeatWorkSession, todaySessionMinutes } from "@/lib/member-sessions";
import { getCurrentMember } from "@/lib/team";

export async function GET() {
  const member = await getCurrentMember();
  if (!member?.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const minutesToday = await todaySessionMinutes(member.id);
    return NextResponse.json({ minutesToday });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load session";
    if (message.includes("member_work_sessions")) {
      return NextResponse.json({ minutesToday: 0 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST() {
  const member = await getCurrentMember();
  if (!member?.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await heartbeatWorkSession(member.id);
    const minutesToday = await todaySessionMinutes(member.id);
    return NextResponse.json({ ok: true, ...result, minutesToday });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Heartbeat failed";
    if (message.includes("member_work_sessions")) {
      return NextResponse.json({ ok: false, skipped: true, minutesToday: 0 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
