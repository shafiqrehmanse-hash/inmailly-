import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { linkId } = await request.json();
  const admin = createAdminClient();
  const { error } = await admin
    .from("outreach_links")
    .update({
      status: "available",
      member_id: null,
      claimed_at: null,
      used_at: null,
      used_by_member_id: null,
    })
    .eq("id", linkId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
