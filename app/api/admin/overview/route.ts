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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: members },
    { count: available },
    { count: claimed },
    { count: used },
    { count: leads },
    { count: deals },
    { count: todayLinks },
    { count: todayLeads },
  ] = await Promise.all([
    admin.from("team_members").select("*", { count: "exact", head: true }),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "available"),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "claimed"),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "used"),
    admin.from("leads").select("*", { count: "exact", head: true }),
    admin.from("leads").select("*", { count: "exact", head: true }).eq("deal_closed", true),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
    admin.from("leads").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString()),
  ]);

  return NextResponse.json({
    members: members || 0,
    links: { available: available || 0, claimed: claimed || 0, used: used || 0 },
    leads: leads || 0,
    deals: deals || 0,
    today: { links: todayLinks || 0, leads: todayLeads || 0 },
  });
}
