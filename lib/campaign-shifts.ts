import { createAdminClient } from "@/lib/supabase/admin";

export type CampaignShiftStatus = "idle" | "started" | "done";

export type CampaignShiftRow = {
  id: string;
  member_id: string;
  work_date: string;
  started_at: string | null;
  completed_at: string | null;
  sends_count: number | null;
  status: CampaignShiftStatus;
  notes: string | null;
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function getTodayShift(memberId: string): Promise<CampaignShiftRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("member_campaign_shifts")
    .select("*")
    .eq("member_id", memberId)
    .eq("work_date", todayKey())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as CampaignShiftRow | null) ?? null;
}

export async function startTodayShift(memberId: string) {
  const admin = createAdminClient();
  const existing = await getTodayShift(memberId);
  const now = new Date().toISOString();

  if (existing?.status === "done") {
    throw new Error("Today's campaign is already marked done. Contact admin if you need to reopen it.");
  }
  if (existing?.status === "started") return existing;

  if (existing) {
    const { data, error } = await admin
      .from("member_campaign_shifts")
      .update({
        status: "started",
        started_at: existing.started_at || now,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as CampaignShiftRow;
  }

  const { data, error } = await admin
    .from("member_campaign_shifts")
    .insert({
      member_id: memberId,
      work_date: todayKey(),
      status: "started",
      started_at: now,
      updated_at: now,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as CampaignShiftRow;
}

export async function completeTodayShift(memberId: string, sendsCount: number, notes?: string) {
  if (!Number.isFinite(sendsCount) || sendsCount < 0 || sendsCount > 5000) {
    throw new Error("Enter a valid send count (0–5000).");
  }
  const admin = createAdminClient();
  const existing = await getTodayShift(memberId);
  if (!existing || existing.status !== "started") {
    throw new Error("Press Campaign started first, then mark done at the end of the day.");
  }
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("member_campaign_shifts")
    .update({
      status: "done",
      completed_at: now,
      sends_count: Math.round(sendsCount),
      notes: notes?.trim() || null,
      updated_at: now,
    })
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as CampaignShiftRow;
}

export async function listShiftsForDate(workDate?: string) {
  const admin = createAdminClient();
  const date = workDate || todayKey();
  const { data: shifts, error } = await admin
    .from("member_campaign_shifts")
    .select("*")
    .eq("work_date", date)
    .order("started_at", { ascending: false });
  if (error) throw new Error(error.message);

  const memberIds = Array.from(new Set((shifts || []).map((s) => s.member_id)));
  let names: Record<string, { name: string; email: string }> = {};
  if (memberIds.length) {
    const { data: members } = await admin
      .from("team_members")
      .select("id, name, email")
      .in("id", memberIds);
    names = Object.fromEntries((members || []).map((m) => [m.id, { name: m.name, email: m.email }]));
  }

  return (shifts || []).map((s) => ({
    ...(s as CampaignShiftRow),
    member_name: names[s.member_id]?.name || "Unknown",
    member_email: names[s.member_id]?.email || "",
  }));
}
