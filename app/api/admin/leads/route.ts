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
  const memberId = request.nextUrl.searchParams.get("memberId");
  const status = request.nextUrl.searchParams.get("status");
  const admin = createAdminClient();
  let query = admin
    .from("leads")
    .select("*, team_members(name, email)")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (memberId) query = query.eq("member_id", memberId);
  if (status && status !== "all") query = query.eq("status", status);
  const { data } = await query;
  return NextResponse.json({ leads: data });
}
