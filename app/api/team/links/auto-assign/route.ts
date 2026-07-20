import { NextRequest, NextResponse } from "next/server";
import {
  LINK_AUTO_ASSIGN,
  LINK_INTELLIGENCE_ASSIGN,
  autoAssignBlockMessage,
  intelligenceAssignBlockMessage,
} from "@/lib/link-auto-assign";
import { canUseOutreachTools } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/team";

function requireOutreachMember(member: Awaited<ReturnType<typeof getCurrentMember>>) {
  if (!member?.is_active || !canUseOutreachTools(member.role)) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { error: null as null, member };
}

type AssignMode = "usual" | "intelligence";

function parseMode(raw: string | null | undefined): AssignMode {
  return raw === "intelligence" ? "intelligence" : "usual";
}

export async function GET(request: NextRequest) {
  const raw = await getCurrentMember();
  const gate = requireOutreachMember(raw);
  if (gate.error) return gate.error;
  const member = gate.member;

  const mode = parseMode(request.nextUrl.searchParams.get("mode"));
  const admin = createAdminClient();

  if (mode === "intelligence") {
    const [activeRes, poolRes] = await Promise.all([
      admin
        .from("outreach_links")
        .select("*", { count: "exact", head: true })
        .eq("member_id", member.id)
        .eq("status", "claimed")
        .eq("outreach_mode", "intelligence"),
      admin
        .from("outreach_links")
        .select("*", { count: "exact", head: true })
        .eq("status", "available")
        .is("member_id", null)
        .not("first_name", "is", null)
        .neq("first_name", ""),
    ]);

    const activeCount = activeRes.count || 0;
    const poolCount = poolRes.count || 0;
    const blocked = activeCount >= LINK_INTELLIGENCE_ASSIGN.maxActiveBeforeBlock;
    const batchSize = LINK_INTELLIGENCE_ASSIGN.batchSize;

    return NextResponse.json({
      mode: "intelligence",
      activeCount,
      poolCount,
      batchSize,
      maxActiveBeforeBlock: LINK_INTELLIGENCE_ASSIGN.maxActiveBeforeBlock,
      canAutoAssign: !blocked && poolCount > 0,
      blocked,
      blockMessage: blocked ? intelligenceAssignBlockMessage(activeCount) : null,
      wouldAssign: blocked ? 0 : Math.min(batchSize, poolCount),
    });
  }

  const [activeRes, poolRes] = await Promise.all([
    admin
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id)
      .eq("status", "claimed")
      .or("outreach_mode.is.null,outreach_mode.eq.usual"),
    admin
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null)
      .or("first_name.is.null,first_name.eq."),
  ]);

  const activeCount = activeRes.count || 0;
  const poolCount = poolRes.count || 0;
  const blocked = activeCount >= LINK_AUTO_ASSIGN.maxActiveBeforeBlock;
  const batchSize = LINK_AUTO_ASSIGN.batchSize;

  return NextResponse.json({
    mode: "usual",
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

export async function POST(request: NextRequest) {
  const raw = await getCurrentMember();
  const gate = requireOutreachMember(raw);
  if (gate.error) return gate.error;
  const member = gate.member;

  let mode: AssignMode = "usual";
  try {
    const body = await request.json().catch(() => ({}));
    mode = parseMode(typeof body?.mode === "string" ? body.mode : null);
  } catch {
    mode = "usual";
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (mode === "intelligence") {
    const { count: activeCount } = await admin
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id)
      .eq("status", "claimed")
      .eq("outreach_mode", "intelligence");

    const active = activeCount || 0;

    if (active >= LINK_INTELLIGENCE_ASSIGN.maxActiveBeforeBlock) {
      return NextResponse.json(
        {
          error: intelligenceAssignBlockMessage(active),
          code: "FINISH_INTELLIGENCE_FIRST",
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
      .not("first_name", "is", null)
      .neq("first_name", "")
      .order("created_at", { ascending: true })
      .limit(LINK_INTELLIGENCE_ASSIGN.batchSize);

    const ids = (available || []).map((l) => l.id);

    if (!ids.length) {
      return NextResponse.json(
        {
          error: "No Intelligence links in the pool — ask admin to upload Named (Intelligence) links.",
          code: "NO_INTELLIGENCE_LINKS",
          assigned: 0,
        },
        { status: 400 }
      );
    }

    const { data: updated, error } = await admin
      .from("outreach_links")
      .update({
        status: "claimed",
        member_id: member.id,
        claimed_at: now,
        outreach_mode: "intelligence",
        updated_at: now,
      })
      .in("id", ids)
      .eq("status", "available")
      .is("member_id", null)
      .select("id");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const assigned = updated?.length || 0;

    return NextResponse.json({
      success: true,
      mode: "intelligence",
      assigned,
      activeCount: active + assigned,
      message: `${assigned} Intelligence link${assigned === 1 ? "" : "s"} assigned — finish them (Generate InMail → mark complete) before requesting more.`,
    });
  }

  const { count: activeCount } = await admin
    .from("outreach_links")
    .select("*", { count: "exact", head: true })
    .eq("member_id", member.id)
    .eq("status", "claimed")
    .or("outreach_mode.is.null,outreach_mode.eq.usual");

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
    .or("first_name.is.null,first_name.eq.")
    .order("created_at", { ascending: true })
    .limit(LINK_AUTO_ASSIGN.batchSize);

  const ids = (available || []).map((l) => l.id);

  if (!ids.length) {
    return NextResponse.json(
      { error: "No Usual (normal) links in the pool right now — check back soon.", assigned: 0 },
      { status: 400 }
    );
  }

  const { data: updated, error } = await admin
    .from("outreach_links")
    .update({
      status: "claimed",
      member_id: member.id,
      claimed_at: now,
      outreach_mode: "usual",
      updated_at: now,
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
    .is("member_id", null)
    .or("first_name.is.null,first_name.eq.");

  await admin
    .from("link_auto_assign_events")
    .insert({
      member_id: member.id,
      assigned_count: assigned,
      active_before: active,
      active_after: activeAfter,
      pool_remaining: poolRemaining ?? null,
    })
    .then(({ error: logErr }) => {
      if (logErr) console.error("auto-assign log failed:", logErr.message);
    });

  return NextResponse.json({
    success: true,
    mode: "usual",
    assigned,
    activeCount: activeAfter,
    poolRemaining: poolRemaining ?? 0,
    message: `${assigned} Usual link${assigned === 1 ? "" : "s"} assigned — open My active and mark each as used when done.`,
  });
}
