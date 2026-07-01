import { NextRequest, NextResponse } from "next/server";
import { inviteCodeFromLabel } from "@/lib/invite-code";
import { getCurrentMember } from "@/lib/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTeamLeader } from "@/lib/roles";

async function requireLeader() {
  const member = await getCurrentMember();
  if (!member || !member.is_active || !isTeamLeader(member.role)) {
    return null;
  }
  return member;
}

export async function GET() {
  const member = await requireLeader();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: codes } = await admin
    .from("invite_codes")
    .select("*")
    .eq("created_by_member_id", member.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({
    codes: codes || [],
    registerPath: "/team/register",
  });
}

export async function POST(request: NextRequest) {
  const member = await requireLeader();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, uses } = await request.json();
  if (!label?.trim()) {
    return NextResponse.json({ error: "Enter a label for this invite batch" }, { status: 400 });
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
    .insert({
      code,
      label: label.trim(),
      uses_left: uses || 25,
      created_by_member_id: member.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code: data });
}
