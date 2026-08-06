import { NextRequest, NextResponse } from "next/server";
import { shouldSaveProspectMessage } from "@/lib/reply-assistant";
import { shouldPromoteLeadToReplied } from "@/lib/team-responses";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Lead } from "@/lib/types";

export async function POST(request: NextRequest) {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const leadId = String(body.leadId || "").trim();
  const reply = String(body.reply || "").trim();
  const prospectMessage = body.prospectMessage ? String(body.prospectMessage).trim() : null;
  const markMeetingBooked = Boolean(body.markMeetingBooked);

  if (!leadId || !reply) {
    return NextResponse.json({ error: "leadId and reply required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("member_id", member.id)
    .is("project_id", null)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const { data: existingMessages } = await admin
    .from("lead_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  const messages = existingMessages || [];
  const now = new Date().toISOString();
  const saved: unknown[] = [];

  if (shouldSaveProspectMessage(messages, prospectMessage) && prospectMessage) {
    const { data: leadMsg, error: leadErr } = await admin
      .from("lead_messages")
      .insert({
        lead_id: leadId,
        sender: "lead",
        sender_name: lead.name,
        msg_type: "reply",
        content: prospectMessage,
        from_screenshot: true,
        ai_generated: false,
      })
      .select("*")
      .single();

    if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 });
    saved.push(leadMsg);
  }

  const { data: teamMsg, error: teamErr } = await admin
    .from("lead_messages")
    .insert({
      lead_id: leadId,
      sender: "team",
      sender_name: member.name,
      msg_type: markMeetingBooked ? "followup" : "reply",
      content: reply,
      ai_generated: true,
      from_screenshot: false,
    })
    .select("*")
    .single();

  if (teamErr) return NextResponse.json({ error: teamErr.message }, { status: 500 });
  saved.push(teamMsg);

  const updates: Record<string, unknown> = { updated_at: now };
  if (markMeetingBooked) {
    updates.status = "meeting_booked";
  } else if (shouldPromoteLeadToReplied(lead.status as Lead["status"])) {
    updates.status = "replied";
  } else if (lead.status === "replied") {
    updates.status = "interested";
  }

  await admin.from("leads").update(updates).eq("id", leadId);
  void admin.from("team_members").update({ last_login: now }).eq("id", member.id);

  return NextResponse.json({
    success: true,
    messages: saved,
    leadStatus: updates.status || lead.status,
  });
}
