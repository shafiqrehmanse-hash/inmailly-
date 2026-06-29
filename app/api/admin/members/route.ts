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
  const enriched = [];
  for (const m of members || []) {
    const [{ count: activeLinks }, { count: leadsCount }] = await Promise.all([
      admin.from("outreach_links").select("*", { count: "exact", head: true }).eq("member_id", m.id).eq("status", "claimed"),
      admin.from("leads").select("*", { count: "exact", head: true }).eq("member_id", m.id),
    ]);
    enriched.push({ ...m, active_links: activeLinks || 0, leads_count: leadsCount || 0 });
  }
  return NextResponse.json({ members: enriched });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name, email, password, role } = await request.json();
  const admin = createAdminClient();
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
    role: role || "member",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { memberId, is_active } = await request.json();
  const admin = createAdminClient();
  const { error } = await admin.from("team_members").update({ is_active }).eq("id", memberId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
