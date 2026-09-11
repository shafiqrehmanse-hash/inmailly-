import { createAdminClient } from "@/lib/supabase/admin";
import { utcDayStartIso } from "@/lib/grow-cap";
import { isOutreachWorker } from "@/lib/roles";

export { GROW_DAILY_USED_CAP, remainingGrowToday, utcDayStartIso } from "@/lib/grow-cap";

export async function countGrowUsedToday(memberId: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("grow_assignments")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("status", "used")
    .gte("used_at", utcDayStartIso());
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function countGrowPending(memberId: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("grow_assignments")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return count || 0;
}

export function isGrowEligibleRole(role: string) {
  return isOutreachWorker(role);
}
