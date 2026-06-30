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
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    membersRes,
    leadsTotal,
    leadsToday,
    leadsWeek,
    dealsClosed,
    fundsSum,
    linksAvailable,
    linksClaimed,
    linksUsed,
    linksUsedToday,
    members,
    claimedLinks,
    usedLinks,
  ] = await Promise.all([
    admin.from("team_members").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("leads").select("*", { count: "exact", head: true }).is("project_id", null),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("project_id", null)
      .gte("created_at", today.toISOString()),
    admin
      .from("leads")
      .select("*", { count: "exact", head: true })
      .is("project_id", null)
      .gte("created_at", weekAgo.toISOString()),
    admin.from("leads").select("*", { count: "exact", head: true }).is("project_id", null).eq("deal_closed", true),
    admin.from("member_funds").select("amount_pkr"),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "available").is("member_id", null),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "claimed"),
    admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("status", "used"),
    admin
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "used")
      .gte("used_at", today.toISOString()),
    admin.from("team_members").select("id, name").eq("is_active", true),
    admin.from("outreach_links").select("member_id").eq("status", "claimed").not("member_id", "is", null),
    admin.from("outreach_links").select("used_by_member_id").eq("status", "used").not("used_by_member_id", "is", null),
  ]);

  const totalFunds = (fundsSum.data || []).reduce((s, r) => s + (r.amount_pkr || 0), 0);
  const memberMap = new Map((members.data || []).map((m) => [m.id, m.name]));

  const claimedByMember: Record<string, number> = {};
  for (const row of claimedLinks.data || []) {
    if (row.member_id) claimedByMember[row.member_id] = (claimedByMember[row.member_id] || 0) + 1;
  }
  const usedByMember: Record<string, number> = {};
  for (const row of usedLinks.data || []) {
    if (row.used_by_member_id) usedByMember[row.used_by_member_id] = (usedByMember[row.used_by_member_id] || 0) + 1;
  }

  const memberPills = (members.data || []).map((m) => ({
    id: m.id,
    name: m.name,
    claimed: claimedByMember[m.id] || 0,
    used: usedByMember[m.id] || 0,
  }));

  return NextResponse.json({
    members: membersRes.count || 0,
    leads: leadsTotal.count || 0,
    leadsToday: leadsToday.count || 0,
    leadsWeek: leadsWeek.count || 0,
    dealsClosed: dealsClosed.count || 0,
    totalFunds,
    links: {
      available: linksAvailable.count || 0,
      claimed: linksClaimed.count || 0,
      used: linksUsed.count || 0,
      usedToday: linksUsedToday.count || 0,
      total: (linksAvailable.count || 0) + (linksClaimed.count || 0) + (linksUsed.count || 0),
    },
    memberPills,
    memberMap: Object.fromEntries(memberMap),
  });
}
