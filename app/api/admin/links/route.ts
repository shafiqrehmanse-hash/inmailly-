import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = request.nextUrl.searchParams.get("status");
  const admin = createAdminClient();
  let query = admin
    .from("outreach_links")
    .select("*, team_members(name)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (status && status !== "all") query = query.eq("status", status);
  const { data } = await query;
  return NextResponse.json({ links: data });
}
