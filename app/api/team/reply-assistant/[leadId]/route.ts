import { NextRequest, NextResponse } from "next/server";
import { getReplyAssistantMeetingLink } from "@/lib/reply-assistant";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("*")
    .eq("id", params.leadId)
    .eq("member_id", member.id)
    .is("project_id", null)
    .maybeSingle();

  if (!lead) return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const { data: messages } = await admin
    .from("lead_messages")
    .select("*")
    .eq("lead_id", params.leadId)
    .order("created_at", { ascending: true });

  const meetingLink = await getReplyAssistantMeetingLink(admin);

  return NextResponse.json({ lead, messages: messages || [], meetingLink });
}
