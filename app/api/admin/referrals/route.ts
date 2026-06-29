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
  const admin = createAdminClient();
  const { data } = await admin
    .from("referrals")
    .select("*, team_members(name)")
    .order("created_at", { ascending: false });
  return NextResponse.json({ referrals: data });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { referralId, reward_pkr } = await request.json();
  const admin = createAdminClient();
  const { data: ref } = await admin.from("referrals").select("*").eq("id", referralId).single();
  if (!ref) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await admin
    .from("referrals")
    .update({ status: "converted", reward_pkr })
    .eq("id", referralId);
  await admin.from("member_funds").insert({
    member_id: ref.referrer_id,
    amount_pkr: reward_pkr,
    note: `Referral conversion: ${ref.referred_email}`,
    added_by: "Admin",
  });
  return NextResponse.json({ success: true });
}
