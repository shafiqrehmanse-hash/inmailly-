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
