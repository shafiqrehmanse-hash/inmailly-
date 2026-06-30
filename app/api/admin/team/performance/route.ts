import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = startOfDay();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const inactiveCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [membersRes, claimedRows, usedRows, leadsRows] = await Promise.all([
    admin
      .from("team_members")
      .select("id, name, email, role, last_login, joined_at, is_active")
      .eq("is_active", true)
      .neq("role", "campaign_manager"),
    admin
      .from("outreach_links")
      .select("member_id, claimed_at")
      .eq("status", "claimed")
      .not("member_id", "is", null),
    admin
      .from("outreach_links")
      .select("used_by_member_id, used_at")
      .eq("status", "used")
      .not("used_by_member_id", "is", null),
    admin
      .from("leads")
      .select("member_id, created_at, status, deal_closed")
      .is("project_id", null),
  ]);

  const members = membersRes.data || [];

  type Acc = {
    claimed: number;
    used: number;
    usedToday: number;
    usedWeek: number;
    leads: number;
    leadsToday: number;
    leadsWeek: number;
    responses: number;
    dealsClosed: number;
    staleClaimed: number;
    dailyUsed: number[];
  };

  const acc = (): Acc => ({
    claimed: 0,
    used: 0,
    usedToday: 0,
    usedWeek: 0,
    leads: 0,
    leadsToday: 0,
    leadsWeek: 0,
    responses: 0,
    dealsClosed: 0,
    staleClaimed: 0,
    dailyUsed: [0, 0, 0, 0, 0, 0, 0],
  });

  const byMember = new Map<string, Acc>();
  for (const m of members) byMember.set(m.id, acc());

  const staleCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  for (const row of claimedRows.data || []) {
    if (!row.member_id) continue;
    const a = byMember.get(row.member_id) || acc();
    a.claimed += 1;
    if (row.claimed_at && new Date(row.claimed_at) < staleCutoff) a.staleClaimed += 1;
    byMember.set(row.member_id, a);
  }

  for (const row of usedRows.data || []) {
    if (!row.used_by_member_id || !row.used_at) continue;
    const a = byMember.get(row.used_by_member_id) || acc();
    a.used += 1;
    const usedAt = new Date(row.used_at);
    if (usedAt >= today) a.usedToday += 1;
    if (usedAt >= weekAgo) {
      a.usedWeek += 1;
      const dayIndex = Math.floor((usedAt.getTime() - weekAgo.getTime()) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) a.dailyUsed[dayIndex] += 1;
    }
    byMember.set(row.used_by_member_id, a);
  }

  const responseStatuses = new Set(["replied", "interested", "follow_up"]);
  for (const row of leadsRows.data || []) {
    if (!row.member_id) continue;
    const a = byMember.get(row.member_id) || acc();
    a.leads += 1;
    const created = new Date(row.created_at);
    if (created >= today) a.leadsToday += 1;
    if (created >= weekAgo) a.leadsWeek += 1;
    if (responseStatuses.has(row.status)) a.responses += 1;
    if (row.deal_closed) a.dealsClosed += 1;
    byMember.set(row.member_id, a);
  }

  const teamMembers = members
    .map((m) => {
      const a = byMember.get(m.id) || acc();
      const productivityScore = a.usedWeek * 10 + a.leadsWeek * 15 + a.usedToday * 5 + a.leadsToday * 8;
      const lastLogin = m.last_login ? new Date(m.last_login) : null;
      const inactive24h = !lastLogin || lastLogin < inactiveCutoff;
      const needsAttention =
        inactive24h || a.staleClaimed > 0 || (a.claimed > 0 && a.used === 0 && a.claimed >= 3);

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        lastLogin: m.last_login,
        joinedAt: m.joined_at,
        claimed: a.claimed,
        used: a.used,
        usedToday: a.usedToday,
        usedWeek: a.usedWeek,
        leads: a.leads,
        leadsToday: a.leadsToday,
        leadsWeek: a.leadsWeek,
        responses: a.responses,
        dealsClosed: a.dealsClosed,
        staleClaimed: a.staleClaimed,
        productivityScore,
        inactive24h,
        needsAttention,
        dailyUsed: a.dailyUsed,
        conversionRate: a.used > 0 ? Math.round((a.leads / a.used) * 100) : 0,
      };
    })
    .sort((a, b) => b.productivityScore - a.productivityScore)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const totals = teamMembers.reduce(
    (s, m) => ({
      claimed: s.claimed + m.claimed,
      used: s.used + m.used,
      usedToday: s.usedToday + m.usedToday,
      leads: s.leads + m.leads,
      leadsToday: s.leadsToday + m.leadsToday,
      inactive: s.inactive + (m.inactive24h ? 1 : 0),
      needsAttention: s.needsAttention + (m.needsAttention ? 1 : 0),
    }),
    { claimed: 0, used: 0, usedToday: 0, leads: 0, leadsToday: 0, inactive: 0, needsAttention: 0 }
  );

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  return NextResponse.json({
    members: teamMembers,
    totals,
    dayLabels,
    generatedAt: new Date().toISOString(),
  });
}
