import { NextResponse } from "next/server";
import { isTeamResponseLead } from "@/lib/team-responses";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEADER_MANAGED_ROLES } from "@/lib/roles";
import { isLeaderResponse, requireTeamLeader } from "@/lib/team-leader-auth";

export async function GET() {
  const leader = await requireTeamLeader();
  if (isLeaderResponse(leader)) return leader;

  const admin = createAdminClient();
  const { data: members } = await admin
    .from("team_members")
    .select("id, name")
    .eq("is_active", true)
    .in("role", [...LEADER_MANAGED_ROLES]);

  const memberIds = (members || []).map((m) => m.id);
  const memberNames = Object.fromEntries((members || []).map((m) => [m.id, m.name]));

  if (!memberIds.length) {
    return NextResponse.json({ responses: [] });
  }

  const { data: leads, error } = await admin
    .from("leads")
    .select("id, member_id, name, company, status, updated_at, created_at")
    .in("member_id", memberIds)
    .is("project_id", null)
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = leads || [];
  if (!rows.length) return NextResponse.json({ responses: [] });

  const leadIds = rows.map((l) => l.id);
  const { data: msgs } = await admin
    .from("lead_messages")
    .select("lead_id, sender, content, created_at")
    .in("lead_id", leadIds)
    .order("created_at", { ascending: false });

  const inboundByLead = new Set<string>();
  const latestByLead = new Map<string, string>();
  for (const msg of msgs || []) {
    if (msg.sender === "lead") inboundByLead.add(msg.lead_id);
    if (!latestByLead.has(msg.lead_id)) {
      latestByLead.set(msg.lead_id, msg.content?.slice(0, 160) || "");
    }
  }

  const responses = rows
    .filter((lead) => isTeamResponseLead(lead, inboundByLead.has(lead.id)))
    .slice(0, 40)
    .map((lead) => ({
      id: lead.id,
      leadName: lead.name,
      company: lead.company,
      status: lead.status,
      memberName: memberNames[lead.member_id] || "Unknown",
      memberId: lead.member_id,
      updatedAt: lead.updated_at,
      lastMessage: latestByLead.get(lead.id) || null,
    }));

  return NextResponse.json({ responses });
}
