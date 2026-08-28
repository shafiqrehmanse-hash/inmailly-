import { NextRequest, NextResponse } from "next/server";
import { listMemberTimeRows } from "@/lib/member-sessions";
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
    const members = await listMemberTimeRows();
    return NextResponse.json({ members });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load time";
    if (message.includes("member_work_sessions")) {
      return NextResponse.json({ members: [], needsMigration: true });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
