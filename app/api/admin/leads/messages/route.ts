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
  const leadId = request.nextUrl.searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lead_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data || [] });
}

export async function POST(request: NextRequest) {
  if (!checkKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { lead_id, content, msg_type, sender, sender_name } = await request.json();
  if (!lead_id || !content?.trim()) {
    return NextResponse.json({ error: "lead_id and content required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("id, status, member_id").eq("id", lead_id).maybeSingle();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { data, error } = await admin
    .from("lead_messages")
    .insert({
      lead_id,
      sender: sender === "lead" ? "lead" : "team",
      sender_name: sender_name?.trim() || "Admin",
      msg_type: msg_type || "message",
      content: content.trim(),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (sender === "lead" && lead.status === "contacted") updates.status = "replied";

  await admin.from("leads").update(updates).eq("id", lead_id);

  return NextResponse.json({ message: data });
}
