import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, verifyAdminKey } from "@/lib/supabase/admin";
import { inviteCodeFromLabel } from "@/lib/invite-code";

function checkKey(request: NextRequest) {
  const key = request.headers.get("x-admin-key") || request.nextUrl.searchParams.get("key");
  return verifyAdminKey(key);
}

export async function GET(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  const [{ data: codes }, { data: defaultRow }] = await Promise.all([
    admin.from("invite_codes").select("*").order("created_at", { ascending: false }).limit(20),
    admin.from("settings").select("value").eq("key", "default_invite_code").maybeSingle(),
  ]);
  return NextResponse.json({
    codes: codes || [],
    defaultCode: defaultRow?.value || null,
    registerPath: "/team/register",
  });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { label, uses, set_as_default } = await request.json();
  if (!label?.trim()) {
    return NextResponse.json({ error: "Enter a name/label to generate the code" }, { status: 400 });
  }

  const admin = createAdminClient();
  let code = inviteCodeFromLabel(label);
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await admin.from("invite_codes").select("id").eq("code", code).maybeSingle();
    if (!existing) break;
    code = inviteCodeFromLabel(label);
  }

  const { data, error } = await admin
    .from("invite_codes")
    .insert({ code, label: label.trim(), uses_left: uses || 50 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (set_as_default) {
    await admin.from("settings").upsert({ key: "default_invite_code", value: code });
  }

  return NextResponse.json({ code: data });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { code } = await request.json();
  if (!code?.trim()) return NextResponse.json({ error: "code required" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("settings").upsert({ key: "default_invite_code", value: code.trim().toUpperCase() });
  return NextResponse.json({ success: true, defaultCode: code.trim().toUpperCase() });
}

/** Attach an existing (or new) invite key to a team leader so their signups show on Team leaders. */
export async function PUT(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, label, leaderId, assignWorkers, uses } = await request.json();
  const inviteCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite key is required" }, { status: 400 });
  }
  if (!leaderId) {
    return NextResponse.json({ error: "Choose a team leader" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: leader } = await admin
    .from("team_members")
    .select("id, name, role, is_active")
    .eq("id", leaderId)
    .maybeSingle();

  if (!leader || leader.role !== "team_leader") {
    return NextResponse.json({ error: "That person is not a team leader" }, { status: 400 });
  }

  const { data: existing } = await admin
    .from("invite_codes")
    .select("id, uses_left, used_count")
    .eq("code", inviteCode)
    .maybeSingle();

  const { count: usedByMembers } = await admin
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .ilike("invite_code", inviteCode);

  const usedCount = usedByMembers || 0;
  const nextUses =
    typeof uses === "number" && uses >= 0
      ? uses
      : existing
        ? existing.uses_left
        : Math.max(10, 50);

  let saved;
  if (existing) {
    const updates: Record<string, unknown> = {
      created_by_member_id: leader.id,
      used_count: Math.max(existing.used_count || 0, usedCount),
    };
    if (typeof label === "string" && label.trim()) updates.label = label.trim();
    const { data, error } = await admin
      .from("invite_codes")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    saved = data;
  } else {
    const { data, error } = await admin
      .from("invite_codes")
      .insert({
        code: inviteCode,
        label: (typeof label === "string" && label.trim()) || inviteCode,
        uses_left: nextUses,
        used_count: usedCount,
        created_by_member_id: leader.id,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    saved = data;
  }

  let assigned = 0;
  if (assignWorkers !== false) {
    const { data: toAssign } = await admin
      .from("team_members")
      .select("id")
      .ilike("invite_code", inviteCode)
      .is("leader_id", null)
      .neq("id", leader.id)
      .neq("role", "team_leader");

    const ids = (toAssign || []).map((m) => m.id);
    if (ids.length) {
      const { error } = await admin
        .from("team_members")
        .update({ leader_id: leader.id })
        .in("id", ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      assigned = ids.length;
    }
  }

  return NextResponse.json({
    success: true,
    code: saved,
    signups: usedCount,
    assignedToLeader: assigned,
    leaderName: leader.name,
  });
}
