import { NextResponse } from "next/server";
import { countGrowPending, countGrowUsedToday, GROW_DAILY_USED_CAP, remainingGrowToday } from "@/lib/grow-profiles";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const member = await getCurrentMember();
  if (!member?.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: rows, error }, usedToday, pending] = await Promise.all([
    admin
      .from("grow_assignments")
      .select("id, status, assigned_at, used_at, profile_id")
      .eq("member_id", member.id)
      .order("assigned_at", { ascending: false }),
    countGrowUsedToday(member.id),
    countGrowPending(member.id),
  ]);

  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("grow_")
          ? "Grow accounts is not set up yet. Ask admin to run migration 037."
          : error.message,
      },
      { status: 500 }
    );
  }

  const profileIds = Array.from(new Set((rows || []).map((r) => r.profile_id)));
  const { data: profiles } = profileIds.length
    ? await admin
        .from("grow_profiles")
        .select("id, first_name, last_name, profile_url")
        .in("id", profileIds)
    : { data: [] as { id: string; first_name: string; last_name: string; profile_url: string }[] };
  const profileById = new Map((profiles || []).map((p) => [p.id, p]));

  const assignments = (rows || []).map((row) => {
    const profile = profileById.get(row.profile_id);
    return {
      id: row.id,
      status: row.status,
      assigned_at: row.assigned_at,
      used_at: row.used_at,
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      profile_url: profile?.profile_url || "",
    };
  });

  return NextResponse.json({
    assignments,
    pending,
    usedToday,
    cap: GROW_DAILY_USED_CAP,
    remainingToday: remainingGrowToday(usedToday),
  });
}

export async function PATCH(request: Request) {
  const member = await getCurrentMember();
  if (!member?.is_active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const assignmentId = String(body.assignmentId || "");
  if (!assignmentId) {
    return NextResponse.json({ error: "assignmentId required" }, { status: 400 });
  }

  const usedToday = await countGrowUsedToday(member.id);
  if (remainingGrowToday(usedToday) <= 0) {
    return NextResponse.json(
      {
        error: `Daily cap reached — you already marked ${GROW_DAILY_USED_CAP} grow profiles used today. Continue tomorrow.`,
        cap: GROW_DAILY_USED_CAP,
      },
      { status: 429 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("grow_assignments")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("member_id", member.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) {
    return NextResponse.json({ error: "Assignment not found or already marked used." }, { status: 404 });
  }

  const nextUsed = usedToday + 1;
  return NextResponse.json({
    success: true,
    usedToday: nextUsed,
    remainingToday: remainingGrowToday(nextUsed),
    cap: GROW_DAILY_USED_CAP,
  });
}
