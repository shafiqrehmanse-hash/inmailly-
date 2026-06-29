import { NextRequest, NextResponse } from "next/server";
import { assertProjectAccess, getCampaignMember } from "@/lib/campaign-auth-server";
import { getClientEmailForProject, notifyClientNewResponse } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { project_id, first_name, last_name, company, profile_url, status, notes } = body;

  if (!project_id || !first_name?.trim() || !last_name?.trim()) {
    return NextResponse.json({ error: "Project and name are required" }, { status: 400 });
  }

  if (!(await assertProjectAccess(member.id, project_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const name = `${first_name.trim()} ${last_name.trim()}`;
  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      member_id: member.id,
      project_id,
      visible_to_client: true,
      name,
      company: company?.trim() || null,
      profile_url: profile_url?.trim() || null,
      status: status || "replied",
      notes: notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: error?.message || "Failed to log response" }, { status: 400 });
  }

  const client = await getClientEmailForProject(project_id);
  if (client.email) {
    await notifyClientNewResponse({
      email: client.email,
      clientName: client.clientName,
      projectName: client.projectName,
      leadName: name,
      preview: notes?.trim() || null,
    });
  }

  return NextResponse.json({ lead, notified: Boolean(client.email) });
}

export async function PATCH(request: NextRequest) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, visible_to_client } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("project_id").eq("id", id).maybeSingle();
  if (!lead?.project_id || !(await assertProjectAccess(member.id, lead.project_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin
    .from("leads")
    .update({ visible_to_client: Boolean(visible_to_client) })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const member = await getCampaignMember();
  if (!member) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("project_id").eq("id", id).maybeSingle();
  if (!lead?.project_id || !(await assertProjectAccess(member.id, lead.project_id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await admin.from("leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
