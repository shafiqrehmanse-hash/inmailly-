import { createAdminClient } from "@/lib/supabase/admin";
import { OUTREACH_REPORTING_ROLES } from "@/lib/roles";

export type MemberPerformance = {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl: string | null;
  lastLogin: string | null;
  /** Latest of login, lead, used link, claim, or auto-assign — used for inactive status */
  lastActiveAt: string | null;
  joinedAt: string;
  claimed: number;
  used: number;
  usedToday: number;
  usedWeek: number;
  leads: number;
  leadsToday: number;
  leadsWeek: number;
  responses: number;
  dealsClosed: number;
  dealsClosedWeek: number;
  referralsJoined: number;
  staleClaimed: number;
  productivityScore: number;
  rank: number;
  inactive24h: boolean;
  needsAttention: boolean;
  dailyUsed: number[];
  conversionRate: number;
  autoAssignWeek: number;
  lastAutoAssignAt: string | null;
};

export type TeamPerformanceData = {
  members: MemberPerformance[];
  totals: {
    claimed: number;
    used: number;
    usedToday: number;
    leads: number;
    leadsToday: number;
    leadsWeek: number;
    dealsClosed: number;
    referralsJoined: number;
    inactive: number;
    needsAttention: number;
    poolAvailable: number;
    autoAssignLinksToday: number;
    autoAssignBatchesToday: number;
  };
  dayLabels: string[];
  generatedAt: string;
  scoreFormula: string;
  scope?: "global" | "assigned_team";
};

/** Closed deals and referral SDRs weigh heavily so the board rewards wins, not only volume. */
export function productivityScoreFor(a: {
  usedWeek: number;
  leadsWeek: number;
  usedToday: number;
  leadsToday: number;
  dealsClosed: number;
  dealsClosedWeek: number;
  referralsJoined: number;
}) {
  return (
    a.usedWeek * 10 +
    a.leadsWeek * 15 +
    a.usedToday * 5 +
    a.leadsToday * 8 +
    a.dealsClosedWeek * 40 +
    a.dealsClosed * 50 +
    a.referralsJoined * 25
  );
}

export const PRODUCTIVITY_SCORE_FORMULA =
  "Weekly used x10 + weekly leads x15 + today's used x5 + today's leads x8 + deals closed this week x40 + all-time closed deals x50 + referral SDRs x25";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function computeTeamPerformance(): Promise<TeamPerformanceData> {
  const admin = createAdminClient();
  const today = startOfDay();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const inactiveCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const staleCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [
    membersRes,
    claimedRows,
    usedRows,
    leadsRows,
    autoAssignWeekRes,
    autoAssignTodayRes,
    poolRes,
    referralsRes,
  ] = await Promise.all([
      admin
        .from("team_members")
        .select("id, name, email, role, photo_url, last_login, joined_at, is_active")
        .eq("is_active", true)
        .in("role", [...OUTREACH_REPORTING_ROLES]),
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
        .select("member_id, created_at, status, deal_closed, closed_at")
        .is("project_id", null),
      admin
        .from("link_auto_assign_events")
        .select("member_id, assigned_count, created_at")
        .gte("created_at", weekAgo.toISOString()),
      admin
        .from("link_auto_assign_events")
        .select("assigned_count")
        .gte("created_at", today.toISOString()),
      admin
        .from("outreach_links")
        .select("*", { count: "exact", head: true })
        .eq("status", "available")
        .is("member_id", null),
      admin
        .from("referrals")
        .select("referrer_id, status")
        .in("status", ["joined", "converted"]),
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
    dealsClosedWeek: number;
    referralsJoined: number;
    staleClaimed: number;
    dailyUsed: number[];
    lastActivityMs: number;
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
    dealsClosedWeek: 0,
    referralsJoined: 0,
    staleClaimed: 0,
    dailyUsed: [0, 0, 0, 0, 0, 0, 0],
    lastActivityMs: 0,
  });

  function bumpActivity(a: Acc, iso: string | null | undefined) {
    if (!iso) return;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return;
    if (t > a.lastActivityMs) a.lastActivityMs = t;
  }

  const byMember = new Map<string, Acc>();
  for (const m of members) byMember.set(m.id, acc());

  for (const row of claimedRows.data || []) {
    if (!row.member_id) continue;
    const a = byMember.get(row.member_id) || acc();
    a.claimed += 1;
    if (row.claimed_at && new Date(row.claimed_at) < staleCutoff) a.staleClaimed += 1;
    bumpActivity(a, row.claimed_at);
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
    bumpActivity(a, row.used_at);
    byMember.set(row.used_by_member_id, a);
  }

  const responseStatuses = new Set(["replied", "interested", "follow_up"]);
  let leadsWeekTotal = 0;
  for (const row of leadsRows.data || []) {
    if (!row.member_id) continue;
    const a = byMember.get(row.member_id) || acc();
    a.leads += 1;
    const created = new Date(row.created_at);
    if (created >= today) a.leadsToday += 1;
    if (created >= weekAgo) {
      a.leadsWeek += 1;
      leadsWeekTotal += 1;
    }
    if (responseStatuses.has(row.status)) a.responses += 1;
    bumpActivity(a, row.created_at);
    if (row.deal_closed) {
      a.dealsClosed += 1;
      const closedAt = row.closed_at ? new Date(row.closed_at) : created;
      if (closedAt >= weekAgo) a.dealsClosedWeek += 1;
      bumpActivity(a, row.closed_at || row.created_at);
    }
    byMember.set(row.member_id, a);
  }

  for (const row of referralsRes.data || []) {
    if (!row.referrer_id) continue;
    const a = byMember.get(row.referrer_id);
    if (!a) continue;
    a.referralsJoined += 1;
  }

  const autoAssignWeekRows = autoAssignWeekRes.error ? [] : autoAssignWeekRes.data || [];
  const autoAssignTodayRows = autoAssignTodayRes.error ? [] : autoAssignTodayRes.data || [];

  const autoAssignByMember: Record<string, { week: number; lastAt: string | null }> = {};
  for (const row of autoAssignWeekRows) {
    const cur = autoAssignByMember[row.member_id] || { week: 0, lastAt: null };
    cur.week += row.assigned_count;
    if (!cur.lastAt || row.created_at > cur.lastAt) cur.lastAt = row.created_at;
    autoAssignByMember[row.member_id] = cur;
    const a = byMember.get(row.member_id);
    if (a) bumpActivity(a, row.created_at);
  }

  const autoAssignLinksToday = autoAssignTodayRows.reduce((s, e) => s + e.assigned_count, 0);
  const autoAssignBatchesToday = autoAssignTodayRows.length;
  const inactiveCutoffMs = inactiveCutoff.getTime();

  const teamMembers = members
    .map((m) => {
      const a = byMember.get(m.id) || acc();
      const auto = autoAssignByMember[m.id] || { week: 0, lastAt: null };
      const productivityScore = productivityScoreFor(a);
      bumpActivity(a, m.last_login);
      bumpActivity(a, m.joined_at);
      const lastActiveAt = a.lastActivityMs > 0 ? new Date(a.lastActivityMs).toISOString() : null;
      // Active if they logged in, added leads, used/claimed links, or auto-assigned within 24h
      const inactive24h = !lastActiveAt || a.lastActivityMs < inactiveCutoffMs;
      const needsAttention =
        inactive24h || a.staleClaimed > 0 || (a.claimed > 0 && a.used === 0 && a.claimed >= 3);

      return {
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        photoUrl: m.photo_url || null,
        lastLogin: m.last_login,
        lastActiveAt,
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
        dealsClosedWeek: a.dealsClosedWeek,
        referralsJoined: a.referralsJoined,
        staleClaimed: a.staleClaimed,
        productivityScore,
        inactive24h,
        needsAttention,
        dailyUsed: a.dailyUsed,
        conversionRate: a.used > 0 ? Math.round((a.leads / a.used) * 100) : 0,
        autoAssignWeek: auto.week,
        lastAutoAssignAt: auto.lastAt,
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
      dealsClosed: s.dealsClosed + m.dealsClosed,
      referralsJoined: s.referralsJoined + m.referralsJoined,
      inactive: s.inactive + (m.inactive24h ? 1 : 0),
      needsAttention: s.needsAttention + (m.needsAttention ? 1 : 0),
    }),
    {
      claimed: 0,
      used: 0,
      usedToday: 0,
      leads: 0,
      leadsToday: 0,
      dealsClosed: 0,
      referralsJoined: 0,
      inactive: 0,
      needsAttention: 0,
    }
  );

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  return {
    members: teamMembers,
    totals: {
      ...totals,
      leadsWeek: leadsWeekTotal,
      poolAvailable: poolRes.count || 0,
      autoAssignLinksToday,
      autoAssignBatchesToday,
    },
    dayLabels,
    generatedAt: new Date().toISOString(),
    scoreFormula: PRODUCTIVITY_SCORE_FORMULA,
  };
}
