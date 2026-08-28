import { NextRequest, NextResponse } from "next/server";
import {
  completeTodayShift,
  getTodayShift,
  startTodayShift,
} from "@/lib/campaign-shifts";
import { canUseOutreachTools } from "@/lib/roles";
import { getCurrentMember } from "@/lib/team";

export async function GET() {
  const member = await getCurrentMember();
  if (!member?.is_active || !canUseOutreachTools(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const shift = await getTodayShift(member.id);
    return NextResponse.json({ shift });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load shift";
    if (message.includes("member_campaign_shifts")) {
      return NextResponse.json({ shift: null });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member?.is_active || !canUseOutreachTools(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const action = body.action as "start" | "complete";

  try {
    if (action === "start") {
      const shift = await startTodayShift(member.id);
      return NextResponse.json({ success: true, shift });
    }
    if (action === "complete") {
      const sends = Number(body.sends_count);
      const shift = await completeTodayShift(member.id, sends, body.notes);
      return NextResponse.json({ success: true, shift });
    }
    return NextResponse.json({ error: "action must be start or complete" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not update campaign";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
