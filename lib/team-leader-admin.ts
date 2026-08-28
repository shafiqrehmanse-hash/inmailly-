import { createAdminClient } from "@/lib/supabase/admin";

export type LeaderWorkerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  joined_at: string;
  last_login: string | null;
  invite_code: string | null;
  leads: number;
  deals: number;
  responses: number;
  used: number;
  claimed: number;
  referrals: number;
  conversionPct: number;
  salesNav: "none" | "pending" | "activation_sent" | "activated" | "error";
};

export type LeaderDashboard = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  is_active: boolean;
  joined_at: string;
  workers: LeaderWorkerRow[];
  totals: {
    workers: number;
    activeWorkers: number;
    signupsViaInvite: number;
    signupsLast30d: number;
    salesNavActivated: number;
    salesNavPending: number;
    leads: number;
    deals: number;
    responses: number;
    used: number;
    referrals: number;
    conversionPct: number;
  };
  inviteCodes: { code: string; label: string | null; usedCount: number }[];
};

const RESPONSE_STATUSES = new Set(["replied", "interested", "follow_up"]);

function conversionPct(deals: number, leads: number) {
  if (!leads) return 0;
  return Math.round((deals / leads) * 1000) / 10;
}

function emptyWorkerStats() {
  return { leads: 0, deals: 0, responses: 0, used: 0, claimed: 0, referrals: 0 };
}

export async function computeLeaderDashboards(): Promise<{
  leaders: LeaderDashboard[];
  unassignedWorkers: number;
}> {
  const admin = createAdminClient();
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const since30Iso = since30.toISOString();

  const [
    membersRes,
    leadsRes,
    claimedRes,
    usedRes,
    referralsRes,
    salesNavRes,
    codesRes,
  ] = await Promise.all([
    admin
      .from("team_members")
      .select(
        "id, name, email, phone, photo_url, role, leader_id, is_active, joined_at, last_login, invite_code"
      )
      .order("name"),
    admin.from("leads").select("member_id, status, deal_closed").is("project_id", null),
    admin.from("outreach_links").select("member_id").eq("status", "claimed").not("member_id", "is", null),
    admin
      .from("outreach_links")
      .select("used_by_member_id")
      .eq("status", "used")
      .not("used_by_member_id", "is", null),
    admin.from("referrals").select("referrer_id, status").in("status", ["joined", "converted"]),
    admin
      .from("sales_nav_license_requests")
      .select("member_id, status, updated_at")
      .order("updated_at", { ascending: false }),
    admin.from("invite_codes").select("code, label, used_count, created_by_member_id"),
  ]);

  const members = membersRes.data || [];
  const leaders = members.filter((m) => m.role === "team_leader");
  const workers = members.filter((m) => m.leader_id);

  const stats = new Map<string, ReturnType<typeof emptyWorkerStats>>();
  function bucket(id: string) {
    let b = stats.get(id);
    if (!b) {
      b = emptyWorkerStats();
      stats.set(id, b);
    }
    return b;
  }

  for (const row of leadsRes.data || []) {
    if (!row.member_id) continue;
    const b = bucket(row.member_id);
    b.leads += 1;
    if (row.deal_closed) b.deals += 1;
    if (RESPONSE_STATUSES.has(String(row.status))) b.responses += 1;
  }
  for (const row of claimedRes.data || []) {
    if (row.member_id) bucket(row.member_id).claimed += 1;
  }
  for (const row of usedRes.data || []) {
    if (row.used_by_member_id) bucket(row.used_by_member_id).used += 1;
  }
  for (const row of referralsRes.data || []) {
    if (row.referrer_id) bucket(row.referrer_id).referrals += 1;
  }

  const salesNavByMember = new Map<string, LeaderWorkerRow["salesNav"]>();
  for (const row of salesNavRes.data || []) {
    if (!row.member_id || salesNavByMember.has(row.member_id)) continue;
    const st = row.status as LeaderWorkerRow["salesNav"];
    salesNavByMember.set(row.member_id, st === "activated" || st === "pending" || st === "activation_sent" || st === "error" ? st : "none");
  }

  const codesByLeader = new Map<string, { code: string; label: string | null; usedCount: number }[]>();
  const signupCountByLeader = new Map<string, number>();
  const codeToLeader = new Map<string, string>();
  for (const c of codesRes.data || []) {
    if (!c.created_by_member_id) continue;
    const list = codesByLeader.get(c.created_by_member_id) || [];
    list.push({
      code: c.code,
      label: c.label,
      usedCount: c.used_count || 0,
    });
    codesByLeader.set(c.created_by_member_id, list);
    codeToLeader.set(String(c.code).toUpperCase(), c.created_by_member_id);
  }
  for (const m of members) {
    const code = typeof m.invite_code === "string" ? m.invite_code.trim().toUpperCase() : "";
    const owner = code ? codeToLeader.get(code) : undefined;
    if (owner) signupCountByLeader.set(owner, (signupCountByLeader.get(owner) || 0) + 1);
  }

  const workersByLeader = new Map<string, typeof workers>();
  for (const w of workers) {
    const list = workersByLeader.get(w.leader_id) || [];
    list.push(w);
    workersByLeader.set(w.leader_id, list);
  }

  function toWorkerRow(m: (typeof members)[number]): LeaderWorkerRow {
    const s = stats.get(m.id) || emptyWorkerStats();
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      role: m.role,
      is_active: m.is_active,
      joined_at: m.joined_at,
      last_login: m.last_login,
      invite_code: m.invite_code,
      leads: s.leads,
      deals: s.deals,
      responses: s.responses,
      used: s.used,
      claimed: s.claimed,
      referrals: s.referrals,
      conversionPct: conversionPct(s.deals, s.leads),
      salesNav: salesNavByMember.get(m.id) || "none",
    };
  }

  const dashboards: LeaderDashboard[] = leaders.map((leader) => {
    const team = (workersByLeader.get(leader.id) || []).map(toWorkerRow);
    const rosterForSalesNav = [...team, toWorkerRow(leader)];
    const sum = (key: keyof Pick<LeaderWorkerRow, "leads" | "deals" | "responses" | "used" | "referrals">) =>
      team.reduce((n, w) => n + w[key], 0);
    const leads = sum("leads");
    const deals = sum("deals");
    const signupsLast30d = team.filter((w) => w.joined_at && w.joined_at >= since30Iso).length;

    return {
      id: leader.id,
      name: leader.name,
      email: leader.email,
      phone: leader.phone,
      photo_url: leader.photo_url,
      is_active: leader.is_active,
      joined_at: leader.joined_at,
      workers: team,
      totals: {
        workers: team.length,
        activeWorkers: team.filter((w) => w.is_active).length,
        signupsViaInvite: signupCountByLeader.get(leader.id) || 0,
        signupsLast30d,
        salesNavActivated: rosterForSalesNav.filter((w) => w.salesNav === "activated").length,
        salesNavPending: rosterForSalesNav.filter(
          (w) => w.salesNav === "pending" || w.salesNav === "activation_sent"
        ).length,
        leads,
        deals,
        responses: sum("responses"),
        used: sum("used"),
        referrals: sum("referrals"),
        conversionPct: conversionPct(deals, leads),
      },
      inviteCodes: codesByLeader.get(leader.id) || [],
    };
  });

  dashboards.sort((a, b) => b.totals.workers - a.totals.workers || a.name.localeCompare(b.name));

  return {
    leaders: dashboards,
    unassignedWorkers: members.filter(
      (m) =>
        !m.leader_id &&
        m.role !== "team_leader" &&
        m.role !== "campaign_manager" &&
        m.role !== "content_manager"
    ).length,
  };
}
