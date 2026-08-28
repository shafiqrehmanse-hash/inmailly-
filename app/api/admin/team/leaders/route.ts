import { NextRequest, NextResponse } from "next/server";
import { verifyAdminKey } from "@/lib/supabase/admin";
import { computeLeaderDashboards } from "@/lib/team-leader-admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await computeLeaderDashboards();
  return NextResponse.json(data);
}
