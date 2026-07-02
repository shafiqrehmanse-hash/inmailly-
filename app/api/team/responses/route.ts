import { NextResponse } from "next/server";
import { isTeamResponseLead } from "@/lib/team-responses";
import { getOutreachEligibleMember } from "@/lib/team-auth-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const member = await getOutreachEligibleMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: leads, error } = await admin
    .from("leads")
    .select("*")
    .eq("member_id", member.id)
    .is("project_id", null)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = leads || [];
  if (rows.length === 0) {
    return NextResponse.json({ responses: [], member });
  }

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
      latestByLead.set(msg.lead_id, msg.content?.slice(0, 120) || "");
    }
  }

  const responses = rows
    .filter((lead) => isTeamResponseLead(lead, inboundByLead.has(lead.id)))
    .map((lead) => ({
      ...lead,
      lastMessage: latestByLead.get(lead.id) || null,
    }));

  return NextResponse.json({ responses, member });
}
