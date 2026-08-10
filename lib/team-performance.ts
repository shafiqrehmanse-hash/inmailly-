import { createAdminClient } from "@/lib/supabase/admin";
import { memberVisibleToTeamViewer } from "@/lib/team-member-visibility";
import { OUTREACH_REPORTING_ROLES } from "@/lib/roles";

export type MemberPerformance = {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl: string | null;
  lastLogin: string | null;
  /** Latest real work activity — login, lead, used link, claim, or auto-assign */
  lastActiveAt: string | null;
  joinedAt: string;
  claimed: number;
  claimedIntelligence: number;
  used: number;
  usedToday: number;
  usedWeek: number;
  intelligenceUsedWeek: number;
  leads: number;
  leadsToday: number;
  leadsWeek: number;
  responses: number;
  dealsClosed: number;
  dealsClosedWeek: number;
  referralsJoined: number;
  staleClaimed: number;
  staleIntelligence: number;
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

/** Rolling 7 calendar days including today (fixes chart off-by-one). */
export function rollingWeekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - 6);
  return x;
}

function dayIndexInRollingWeek(iso: string, periodStart: Date): number {
  const t = new Date(iso).getTime();
  const idx = Math.floor((t - periodStart.getTime()) / (24 * 60 * 60 * 1000));
  return idx >= 0 && idx < 7 ? idx : -1;
}

/** Each deal counts once; weekly closes get a bonus. Intelligence links score higher. */
export function productivityScoreFor(a: {
  usedWeek: number;
  intelligenceUsedWeek: number;
  leadsWeek: number;
  usedToday: number;
  leadsToday: number;
  dealsClosed: number;
  dealsClosedWeek: number;
  referralsJoined: number;
}) {
  const usualWeek = Math.max(0, a.usedWeek - a.intelligenceUsedWeek);
  return (
    usualWeek * 10 +
    a.intelligenceUsedWeek * 13 +
    a.leadsWeek * 15 +
    a.usedToday * 5 +
    a.leadsToday * 8 +
    a.dealsClosed * 50 +
    a.dealsClosedWeek * 10 +
    a.referralsJoined * 25
  );
}

export const PRODUCTIVITY_SCORE_FORMULA =
  "Usual links used this week x10 + Intelligence links used this week x13 + weekly leads x15 + today's used x5 + today's leads x8 + all deals x50 + deals closed this week bonus x10 + referral SDRs x25";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export type ComputeTeamPerformanceOptions = {
  /** Omit hidden members except the viewer always sees their own row. */
  viewerMemberId?: string | null;
  /** Admin views: include hidden members in leaderboard and totals. */
  includeHidden?: boolean;
};

export async function computeTeamPerformance(
  opts?: ComputeTeamPerformanceOptions
): Promise<TeamPerformanceData> {
  const admin = createAdminClient();
  const today = startOfDay();
  const periodStart = rollingWeekStart(today);
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
      .select("id, name, email, role, photo_url, last_login, joined_at, is_active, hidden_from_team")
      .eq("is_active", true)
      .in("role", [...OUTREACH_REPORTING_ROLES]),
    admin
      .from("outreach_links")
      .select("member_id, claimed_at, outreach_mode")
      .eq("status", "claimed")
      .not("member_id", "is", null),
    admin
      .from("outreach_links")
      .select("used_by_member_id, used_at, outreach_mode")
      .eq("status", "used")
      .not("used_by_member_id", "is", null),
    admin
      .from("leads")
      .select("member_id, created_at, status, deal_closed, closed_at")
      .is("project_id", null),
    admin
      .from("link_auto_assign_events")
      .select("member_id, assigned_count, created_at")
      .gte("created_at", periodStart.toISOString()),
    admin
      .from("link_auto_assign_events")
      .select("assigned_count")
      .gte("created_at", today.toISOString()),
    admin
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null),
    admin.from("referrals").select("referrer_id, status").in("status", ["joined", "converted"]),
  ]);

  const members = membersRes.data || [];

  type Acc = {
    claimed: number;
    claimedIntelligence: number;
    used: number;
    usedToday: number;
    usedWeek: number;
    intelligenceUsedWeek: number;
    leads: number;
    leadsToday: number;
    leadsWeek: number;
    responses: number;
    dealsClosed: number;
    dealsClosedWeek: number;
    referralsJoined: number;
    staleClaimed: number;
    staleIntelligence: number;
    dailyUsed: number[];
    lastActivityMs: number;
  };

  const acc = (): Acc => ({
    claimed: 0,
    claimedIntelligence: 0,
    used: 0,
    usedToday: 0,
    usedWeek: 0,
    intelligenceUsedWeek: 0,
    leads: 0,
    leadsToday: 0,
    leadsWeek: 0,
    responses: 0,
    dealsClosed: 0,
    dealsClosedWeek: 0,
    referralsJoined: 0,
    staleClaimed: 0,
    staleIntelligence: 0,
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
    if (row.outreach_mode === "intelligence") a.claimedIntelligence += 1;
    const isStale = row.claimed_at && new Date(row.claimed_at) < staleCutoff;
    if (isStale) {
      a.staleClaimed += 1;
      if (row.outreach_mode === "intelligence") a.staleIntelligence += 1;
    }
    bumpActivity(a, row.claimed_at);
    byMember.set(row.member_id, a);
  }

  for (const row of usedRows.data || []) {
    if (!row.used_by_member_id || !row.used_at) continue;
    const a = byMember.get(row.used_by_member_id) || acc();
    const isIntel = row.outreach_mode === "intelligence";
    a.used += 1;
    const usedAt = new Date(row.used_at);
    if (usedAt >= today) a.usedToday += 1;
    if (usedAt >= periodStart) {
      a.usedWeek += 1;
      if (isIntel) a.intelligenceUsedWeek += 1;
      const dayIndex = dayIndexInRollingWeek(row.used_at, periodStart);
      if (dayIndex >= 0) a.dailyUsed[dayIndex] += 1;
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
    if (created >= periodStart) {
      a.leadsWeek += 1;
      leadsWeekTotal += 1;
    }
    if (responseStatuses.has(row.status)) a.responses += 1;
    bumpActivity(a, row.created_at);
    if (row.deal_closed) {
      a.dealsClosed += 1;
      const closedAt = row.closed_at ? new Date(row.closed_at) : created;
      if (closedAt >= periodStart) a.dealsClosedWeek += 1;
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

  let teamMembers: Omit<MemberPerformance, "rank">[] = members
    .map((m) => {
      const a = byMember.get(m.id) || acc();
      const auto = autoAssignByMember[m.id] || { week: 0, lastAt: null };
      const productivityScore = productivityScoreFor(a);
      bumpActivity(a, m.last_login);
      const lastActiveAt = a.lastActivityMs > 0 ? new Date(a.lastActivityMs).toISOString() : null;
      const inactive24h = !lastActiveAt || a.lastActivityMs < inactiveCutoffMs;
      const needsAttention =
        inactive24h ||
        a.staleClaimed > 0 ||
        a.staleIntelligence > 0 ||
        (a.claimedIntelligence > 0 && a.intelligenceUsedWeek === 0 && a.claimedIntelligence >= 1) ||
        (a.claimed > 0 && a.used === 0 && a.claimed >= 3);

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
        claimedIntelligence: a.claimedIntelligence,
        used: a.used,
        usedToday: a.usedToday,
        usedWeek: a.usedWeek,
        intelligenceUsedWeek: a.intelligenceUsedWeek,
        leads: a.leads,
        leadsToday: a.leadsToday,
        leadsWeek: a.leadsWeek,
        responses: a.responses,
        dealsClosed: a.dealsClosed,
        dealsClosedWeek: a.dealsClosedWeek,
        referralsJoined: a.referralsJoined,
        staleClaimed: a.staleClaimed,
        staleIntelligence: a.staleIntelligence,
        productivityScore,
        inactive24h,
        needsAttention,
        dailyUsed: a.dailyUsed,
        conversionRate: a.used > 0 ? Math.round((a.leads / a.used) * 100) : 0,
        autoAssignWeek: auto.week,
        lastAutoAssignAt: auto.lastAt,
      };
    })
    .sort((a, b) => b.productivityScore - a.productivityScore);

  if (!opts?.includeHidden) {
    teamMembers = teamMembers.filter((m) => {
      const raw = members.find((row) => row.id === m.id);
      return memberVisibleToTeamViewer(
        { id: m.id, hidden_from_team: raw?.hidden_from_team },
        opts?.viewerMemberId
      );
    });
  }

  const rankedMembers: MemberPerformance[] = teamMembers.map((m, i) => ({ ...m, rank: i + 1 }));

  const totals = rankedMembers.reduce(
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
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  return {
    members: rankedMembers,
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
