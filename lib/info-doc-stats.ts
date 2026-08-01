import { createAdminClient } from "@/lib/supabase/admin";
import type { InfoDocStats } from "@/lib/info-doc";

/** Last 30 calendar days of outreach activity for info doc auto-fill. */
export async function getMemberInfoDocStats(memberId: string): Promise<InfoDocStats> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  const [usedRes, dealsRows] = await Promise.all([
    admin
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("used_by_member_id", memberId)
      .eq("status", "used")
      .gte("used_at", sinceIso),
    admin
      .from("leads")
      .select("closed_at, created_at")
      .eq("member_id", memberId)
      .eq("deal_closed", true)
      .is("project_id", null)
      .gte("created_at", sinceIso),
  ]);

  const closedDeals30d = (dealsRows.data || []).filter((row) => {
    const d = row.closed_at ? new Date(row.closed_at) : new Date(row.created_at);
    return d >= since;
  }).length;

  return {
    usedLinks30d: usedRes.count || 0,
    closedDeals30d,
  };
}
