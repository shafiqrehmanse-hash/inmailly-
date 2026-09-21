import { createAdminClient } from "@/lib/supabase/admin";
import type { SalesNavLicenseRequest } from "@/lib/types";

export type SalesNavRequestRow = SalesNavLicenseRequest & {
  leader_id: string | null;
  leader_name: string | null;
  leads_count: number;
};

export async function enrichSalesNavRequests(
  rows: SalesNavLicenseRequest[]
): Promise<SalesNavRequestRow[]> {
  if (!rows.length) return [];
  const admin = createAdminClient();
  const memberIds = Array.from(new Set(rows.map((r) => r.member_id).filter(Boolean)));
  if (!memberIds.length) {
    return rows.map((r) => ({ ...r, leader_id: null, leader_name: null, leads_count: 0 }));
  }

  const [{ data: members }, { data: leadRows }] = await Promise.all([
    admin.from("team_members").select("id, leader_id").in("id", memberIds),
    admin.from("leads").select("member_id").in("member_id", memberIds).is("project_id", null),
  ]);

  const leaderIds = Array.from(
    new Set((members || []).map((m) => m.leader_id).filter(Boolean) as string[])
  );
  const { data: leaders } =
    leaderIds.length > 0
      ? await admin.from("team_members").select("id, name").in("id", leaderIds)
      : { data: [] as { id: string; name: string }[] };

  const leaderNameById = new Map((leaders || []).map((l) => [l.id, l.name]));
  const leaderIdByMember = new Map((members || []).map((m) => [m.id, m.leader_id as string | null]));
  const leadsCountByMember = new Map<string, number>();
  for (const row of leadRows || []) {
    if (!row.member_id) continue;
    leadsCountByMember.set(row.member_id, (leadsCountByMember.get(row.member_id) || 0) + 1);
  }

  return rows
    .map((r) => {
      const leaderId = leaderIdByMember.get(r.member_id) || null;
      return {
        ...r,
        leader_id: leaderId,
        leader_name: leaderId ? leaderNameById.get(leaderId) || null : null,
        leads_count: leadsCountByMember.get(r.member_id) || 0,
      };
    })
    .sort((a, b) => b.leads_count - a.leads_count || a.member_name.localeCompare(b.member_name));
}

export function stripActivationKey<T extends { activation_key?: string | null }>(row: T): T {
  return { ...row, activation_key: null };
}
