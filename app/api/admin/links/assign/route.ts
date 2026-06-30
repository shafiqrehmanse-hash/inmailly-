import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, link_ids, member_id, count } = body as {
    action: "assign" | "release" | "assign_bulk";
    link_ids?: string[];
    member_id?: string;
    count?: number;
  };

  const admin = createAdminClient();

  if (action === "release") {
    const ids = Array.isArray(link_ids) ? link_ids : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Select links to release" }, { status: 400 });
    }

    const { error } = await admin
      .from("outreach_links")
      .update({
        status: "available",
        member_id: null,
        claimed_at: null,
        used_at: null,
        used_by_member_id: null,
      })
      .in("id", ids)
      .in("status", ["claimed", "used"]);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, released: ids.length });
  }

  if (!member_id) {
    return NextResponse.json({ error: "member_id is required" }, { status: 400 });
  }

  const { data: member } = await admin
    .from("team_members")
    .select("id, name, is_active, role")
    .eq("id", member_id)
    .maybeSingle();

  if (!member?.is_active) {
    return NextResponse.json({ error: "Member not found or inactive" }, { status: 400 });
  }

  let idsToAssign: string[] = [];

  if (action === "assign_bulk") {
    const n = Math.min(Math.max(1, Number(count) || 1), 500);
    const { data: available } = await admin
      .from("outreach_links")
      .select("id")
      .eq("status", "available")
      .is("member_id", null)
      .order("created_at", { ascending: true })
      .limit(n);

    idsToAssign = (available || []).map((l) => l.id);
  } else {
    idsToAssign = Array.isArray(link_ids) ? link_ids : [];
  }

  if (!idsToAssign.length) {
    return NextResponse.json({ error: "No available links to assign" }, { status: 400 });
  }

  const { data: updated, error } = await admin
    .from("outreach_links")
    .update({
      status: "claimed",
      member_id,
      claimed_at: new Date().toISOString(),
    })
    .in("id", idsToAssign)
    .eq("status", "available")
    .is("member_id", null)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    success: true,
    assigned: updated?.length || 0,
    member: member.name,
  });
}
