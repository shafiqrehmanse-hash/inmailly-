import { NextResponse } from "next/server";
import { LINK_AUTO_ASSIGN, autoAssignBlockMessage } from "@/lib/link-auto-assign";
import { canUseOutreachTools } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/team";

function requireOutreachMember(member: Awaited<ReturnType<typeof getCurrentMember>>) {
  if (!member?.is_active || !canUseOutreachTools(member.role)) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { error: null as null, member };
}

export async function GET() {
  const raw = await getCurrentMember();
  const gate = requireOutreachMember(raw);
  if (gate.error) return gate.error;
  const member = gate.member;

  const supabase = createServerSupabase();
  const [activeRes, poolRes] = await Promise.all([
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id)
      .eq("status", "claimed"),
    supabase
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null),
  ]);

  const activeCount = activeRes.count || 0;
  const poolCount = poolRes.count || 0;
  const blocked = activeCount >= LINK_AUTO_ASSIGN.maxActiveBeforeBlock;
  const batchSize = LINK_AUTO_ASSIGN.batchSize;

  return NextResponse.json({
    activeCount,
    poolCount,
    batchSize,
    maxActiveBeforeBlock: LINK_AUTO_ASSIGN.maxActiveBeforeBlock,
    canAutoAssign: !blocked && poolCount > 0,
    blocked,
    blockMessage: blocked ? autoAssignBlockMessage(activeCount) : null,
    wouldAssign: blocked ? 0 : Math.min(batchSize, poolCount),
  });
}

export async function POST() {
  const raw = await getCurrentMember();
  const gate = requireOutreachMember(raw);
  if (gate.error) return gate.error;
  const member = gate.member;

  const admin = createAdminClient();

  const { count: activeCount } = await admin
    .from("outreach_links")
    .select("*", { count: "exact", head: true })
    .eq("member_id", member.id)
    .eq("status", "claimed");

  const active = activeCount || 0;

  if (active >= LINK_AUTO_ASSIGN.maxActiveBeforeBlock) {
    return NextResponse.json(
      {
        error: autoAssignBlockMessage(active),
        activeCount: active,
        assigned: 0,
      },
      { status: 409 }
    );
  }

  const { data: available } = await admin
    .from("outreach_links")
    .select("id")
    .eq("status", "available")
    .is("member_id", null)
    .order("created_at", { ascending: true })
    .limit(LINK_AUTO_ASSIGN.batchSize);

  const ids = (available || []).map((l) => l.id);

  if (!ids.length) {
    return NextResponse.json(
      { error: "No links in the pool right now — check back soon.", assigned: 0 },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("outreach_links")
    .update({
      status: "claimed",
      member_id: member.id,
      claimed_at: now,
    })
    .in("id", ids)
    .eq("status", "available")
    .is("member_id", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const assigned = updated?.length || 0;
  const activeAfter = active + assigned;

  const { count: poolRemaining } = await admin
    .from("outreach_links")
    .select("*", { count: "exact", head: true })
    .eq("status", "available")
    .is("member_id", null);

  await admin.from("link_auto_assign_events").insert({
    member_id: member.id,
    assigned_count: assigned,
    active_before: active,
    active_after: activeAfter,
    pool_remaining: poolRemaining ?? null,
  }).then(({ error: logErr }) => {
    if (logErr) console.error("auto-assign log failed:", logErr.message);
  });

  return NextResponse.json({
    success: true,
    assigned,
    activeCount: activeAfter,
    poolRemaining: poolRemaining ?? 0,
    message: `${assigned} link${assigned === 1 ? "" : "s"} assigned — open My active and mark each as used when done.`,
  });
}
