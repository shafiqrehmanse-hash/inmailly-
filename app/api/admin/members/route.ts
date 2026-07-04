import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: members } = await admin.from("team_members").select("*").order("joined_at", { ascending: false });
  const memberIds = (members || []).map((m) => m.id);

  const countsByMember = new Map<string, { active_links: number; leads_count: number; deals_closed: number }>();
  for (const id of memberIds) {
    countsByMember.set(id, { active_links: 0, leads_count: 0, deals_closed: 0 });
  }

  if (memberIds.length > 0) {
    const [{ data: claimedLinks }, { data: outreachLeads }] = await Promise.all([
      admin.from("outreach_links").select("member_id").eq("status", "claimed").in("member_id", memberIds),
      admin.from("leads").select("member_id, deal_closed").is("project_id", null).in("member_id", memberIds),
    ]);

    for (const row of claimedLinks || []) {
      const bucket = countsByMember.get(row.member_id);
      if (bucket) bucket.active_links += 1;
    }
    for (const row of outreachLeads || []) {
      const bucket = countsByMember.get(row.member_id);
      if (!bucket) continue;
      bucket.leads_count += 1;
      if (row.deal_closed) bucket.deals_closed += 1;
    }
  }

  const enriched = (members || []).map((m) => {
    const stats = countsByMember.get(m.id) || { active_links: 0, leads_count: 0, deals_closed: 0 };
    return { ...m, ...stats };
  });
  return NextResponse.json({ members: enriched });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, email, password, role, phone } = await request.json();
  const admin = createAdminClient();
  const cleanedPhone =
    typeof phone === "string" ? phone.replace(/[^+0-9]/g, "") || null : null;
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { error } = await admin.from("team_members").insert({
    user_id: authData.user.id,
    name,
    email: email.toLowerCase(),
    phone: cleanedPhone,
    role: role || "member",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId, is_active, role, leader_id } = await request.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("team_members")
    .select("id, role")
    .eq("id", memberId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof is_active === "boolean") updates.is_active = is_active;

  if (role) {
    updates.role = role;
    // Leaders don't report to leaders
    if (role === "team_leader" || role === "campaign_manager") {
      updates.leader_id = null;
    }
  }

  if (leader_id !== undefined) {
    const nextLeaderId = leader_id || null;
    if (nextLeaderId) {
      const { data: leader } = await admin
        .from("team_members")
        .select("id, role, is_active")
        .eq("id", nextLeaderId)
        .maybeSingle();
      if (!leader?.is_active || leader.role !== "team_leader") {
        return NextResponse.json({ error: "leader_id must be an active team leader" }, { status: 400 });
      }
      const effectiveRole = (role as string) || existing.role;
      if (effectiveRole === "team_leader" || effectiveRole === "campaign_manager") {
        return NextResponse.json(
          { error: "Only outreach workers can be assigned to a team leader" },
          { status: 400 }
        );
      }
    }
    updates.leader_id = nextLeaderId;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await admin.from("team_members").update(updates).eq("id", memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If demoting a leader, unassign their workers
  if (role && existing.role === "team_leader" && role !== "team_leader") {
    await admin.from("team_members").update({ leader_id: null }).eq("leader_id", memberId);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = await request.json();
  if (!memberId) {
    return NextResponse.json({ error: "memberId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("team_members")
    .select("id, user_id, name, email")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (member.user_id) {
    const { error: authError } = await admin.auth.admin.deleteUser(member.user_id);
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  } else {
    const { error: rowError } = await admin.from("team_members").delete().eq("id", memberId);
    if (rowError) {
      return NextResponse.json({ error: rowError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, deleted: member.email });
}
