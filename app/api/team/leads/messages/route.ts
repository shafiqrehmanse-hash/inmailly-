import { NextRequest, NextResponse } from "next/server";
import { shouldPromoteLeadToReplied } from "@/lib/team-responses";
import { getOutreachTeamMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Lead } from "@/lib/types";

export async function GET(request: NextRequest) {
  const member = await getOutreachTeamMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const leadId = request.nextUrl.searchParams.get("leadId");
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("member_id", member.id)
    .is("project_id", null)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { data, error } = await admin
    .from("lead_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data || [] });
}

export async function POST(request: NextRequest) {
  const member = await getOutreachTeamMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const leadId = body.lead_id as string | undefined;
  const content = body.content?.trim();
  if (!leadId || !content) {
    return NextResponse.json({ error: "lead_id and content required" }, { status: 400 });
  }

  const sender = body.sender === "lead" ? "lead" : "team";
  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("leads")
    .select("id, status, name")
    .eq("id", leadId)
    .eq("member_id", member.id)
    .is("project_id", null)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { data: message, error } = await admin
    .from("lead_messages")
    .insert({
      lead_id: leadId,
      sender,
      sender_name:
        sender === "lead"
          ? (body.sender_name?.trim() || lead.name)
          : (body.sender_name?.trim() || member.name),
      msg_type: body.msg_type || "message",
      content,
    })
    .select("*")
    .single();

  if (error || !message) {
    return NextResponse.json({ error: error?.message || "Could not save message" }, { status: 500 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (sender === "lead" && shouldPromoteLeadToReplied(lead.status as Lead["status"])) {
    updates.status = "replied";
  }

  if (Object.keys(updates).length > 1) {
    await admin.from("leads").update(updates).eq("id", leadId);
  } else {
    await admin.from("leads").update({ updated_at: updates.updated_at }).eq("id", leadId);
  }

  return NextResponse.json({ message, promotedToReplied: updates.status === "replied" });
}
