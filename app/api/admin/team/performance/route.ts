import { NextRequest, NextResponse } from "next/server";
import { verifyAdminKey } from "@/lib/supabase/admin";
import { computeTeamPerformance } from "@/lib/team-performance";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await computeTeamPerformance();
  return NextResponse.json(data);
}
