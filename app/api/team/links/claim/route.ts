import { NextRequest, NextResponse } from "next/server";
import { canUseOutreachTools } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMember } from "@/lib/team";

/** Count available intelligence-ready links in the pool. */
export async function GET() {
  const member = await getCurrentMember();
  if (!member?.is_active || !canUseOutreachTools(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("outreach_links")
    .select("*", { count: "exact", head: true })
    .eq("status", "available")
    .is("member_id", null)
    .not("first_name", "is", null)
    .neq("first_name", "");

  return NextResponse.json({ intelligenceAvailable: count || 0 });
}

/**
 * Claim a specific link (or next intelligence link) with outreach_mode.
 * body: { linkId?, mode: 'usual' | 'intelligence' }
 */
export async function POST(request: NextRequest) {
  const member = await getCurrentMember();
  if (!member?.is_active || !canUseOutreachTools(member.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const mode = body.mode === "intelligence" ? "intelligence" : "usual";
  const linkId = typeof body.linkId === "string" ? body.linkId.trim() : "";

  const admin = createAdminClient();
  const now = new Date().toISOString();

  if (mode === "intelligence") {
    const { count: intelCount } = await admin
      .from("outreach_links")
      .select("*", { count: "exact", head: true })
      .eq("status", "available")
      .is("member_id", null)
      .not("first_name", "is", null)
      .neq("first_name", "");

    if (!intelCount) {
      return NextResponse.json(
        {
          error: "No intelligence links available",
          code: "NO_INTELLIGENCE_LINKS",
          intelligenceAvailable: 0,
        },
        { status: 409 }
      );
    }

    // Prefer the clicked link if it is intelligence-ready
    if (linkId) {
      const { data: specific } = await admin
        .from("outreach_links")
        .update({
          status: "claimed",
          member_id: member.id,
          claimed_at: now,
          outreach_mode: "intelligence",
          updated_at: now,
        })
        .eq("id", linkId)
        .eq("status", "available")
        .is("member_id", null)
        .not("first_name", "is", null)
        .neq("first_name", "")
        .select("*")
        .maybeSingle();

      if (specific) {
        return NextResponse.json({ link: specific, mode: "intelligence" });
      }
    }

    // Otherwise claim the oldest named available link
    const { data: next } = await admin
      .from("outreach_links")
      .select("id")
      .eq("status", "available")
      .is("member_id", null)
      .not("first_name", "is", null)
      .neq("first_name", "")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!next) {
      return NextResponse.json(
        {
          error: "No intelligence links available",
          code: "NO_INTELLIGENCE_LINKS",
          intelligenceAvailable: 0,
        },
        { status: 409 }
      );
    }

    const { data: claimed } = await admin
      .from("outreach_links")
      .update({
        status: "claimed",
        member_id: member.id,
        claimed_at: now,
        outreach_mode: "intelligence",
        updated_at: now,
      })
      .eq("id", next.id)
      .eq("status", "available")
      .is("member_id", null)
      .select("*")
      .maybeSingle();

    if (!claimed) {
      return NextResponse.json({ error: "Link already claimed by someone else" }, { status: 409 });
    }

    return NextResponse.json({ link: claimed, mode: "intelligence" });
  }

  // Usual mode
  if (!linkId) {
    return NextResponse.json({ error: "linkId required for usual claim" }, { status: 400 });
  }

  const { data: claimed } = await admin
    .from("outreach_links")
    .update({
      status: "claimed",
      member_id: member.id,
      claimed_at: now,
      outreach_mode: "usual",
      updated_at: now,
    })
    .eq("id", linkId)
    .eq("status", "available")
    .is("member_id", null)
    .select("*")
    .maybeSingle();

  if (!claimed) {
    return NextResponse.json({ error: "Link already claimed by someone else" }, { status: 409 });
  }

  return NextResponse.json({ link: claimed, mode: "usual" });
}
