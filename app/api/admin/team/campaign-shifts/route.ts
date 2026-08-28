import { NextRequest, NextResponse } from "next/server";
import { listShiftsForDate } from "@/lib/campaign-shifts";
import { verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const date = request.nextUrl.searchParams.get("date") || undefined;
    const shifts = await listShiftsForDate(date);
    return NextResponse.json({ shifts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load shifts";
    if (message.includes("member_campaign_shifts")) {
      return NextResponse.json({ shifts: [], needsMigration: true });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
