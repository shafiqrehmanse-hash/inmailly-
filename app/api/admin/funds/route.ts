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
  const { memberId, amount, note } = await request.json();
  const admin = createAdminClient();
  const { error } = await admin.from("member_funds").insert({
    member_id: memberId,
    amount_pkr: amount,
    note: note || "",
    added_by: "Admin",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const memberId = request.nextUrl.searchParams.get("memberId");
  let query = admin.from("member_funds").select("*, team_members(name, email)").order("added_at", { ascending: false });
  if (memberId) query = query.eq("member_id", memberId);
  const { data } = await query;
  return NextResponse.json({ funds: data });
}
