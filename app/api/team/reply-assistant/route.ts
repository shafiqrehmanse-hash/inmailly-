import { NextResponse } from "next/server";
import { getReplyAssistantMeetingLink } from "@/lib/reply-assistant";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  const [{ data: leads }, meetingLink] = await Promise.all([
    admin
      .from("leads")
      .select("id, name, company, position, profile_url, status, updated_at, created_at")
      .eq("member_id", member.id)
      .is("project_id", null)
      .order("updated_at", { ascending: false })
      .limit(200),
    getReplyAssistantMeetingLink(admin),
  ]);

  const leadIds = (leads || []).map((l) => l.id);
  const messagesByLead: Record<string, { content: string; sender: string; created_at: string }[]> = {};

  if (leadIds.length) {
    const { data: msgs } = await admin
      .from("lead_messages")
      .select("lead_id, content, sender, created_at")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });

    for (const m of msgs || []) {
      if (!messagesByLead[m.lead_id]) messagesByLead[m.lead_id] = [];
      if (messagesByLead[m.lead_id].length < 1) {
        messagesByLead[m.lead_id].push({
          content: m.content,
          sender: m.sender,
          created_at: m.created_at,
        });
      }
    }
  }

  const threads = (leads || []).map((lead) => {
    const last = messagesByLead[lead.id]?.[0];
    return {
      ...lead,
      lastPreview: last ? last.content.slice(0, 120) : null,
      lastSender: last?.sender || null,
      hasThread: Boolean(last),
    };
  });

  threads.sort((a, b) => {
    if (a.hasThread !== b.hasThread) return a.hasThread ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return NextResponse.json({
    threads,
    meetingLinkConfigured: Boolean(meetingLink),
    member: { id: member.id, name: member.name },
  });
}
