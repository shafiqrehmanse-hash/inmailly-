import { NextRequest, NextResponse } from "next/server";
import { getCurrentClient } from "@/lib/client-auth-server";
import { notifyTeamClientFollowup } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const client = await getCurrentClient();
  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { lead_id, message } = body as { lead_id?: string; message?: string };

  if (!lead_id?.trim()) {
    return NextResponse.json({ error: "Response id is required" }, { status: 400 });
  }

  const trimmed = message?.trim() || "";
  if (trimmed.length < 10) {
    return NextResponse.json({ error: "Write at least 10 characters for your follow-up" }, { status: 400 });
  }
  if (trimmed.length > 4000) {
    return NextResponse.json({ error: "Follow-up is too long (max 4000 characters)" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: lead } = await admin
    .from("leads")
    .select("id, name, project_id, visible_to_client, client_followup_message")
    .eq("id", lead_id)
    .maybeSingle();

  if (!lead?.project_id || !lead.visible_to_client) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  const { data: project } = await admin
    .from("projects")
    .select("id, name, client_id")
    .eq("id", lead.project_id)
    .maybeSingle();

  if (!project || project.client_id !== client.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("leads")
    .update({
      client_followup_message: trimmed,
      client_followup_at: now,
      updated_at: now,
    })
    .eq("id", lead_id)
    .select("id, client_followup_message, client_followup_at")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message || "Could not save follow-up" }, { status: 400 });
  }

  await notifyTeamClientFollowup({
    projectId: project.id,
    projectName: project.name,
    clientName: client.company_name || client.name,
    leadName: lead.name,
    message: trimmed,
    isUpdate: Boolean(lead.client_followup_message),
  });

  return NextResponse.json({
    success: true,
    client_followup_message: updated.client_followup_message,
    client_followup_at: updated.client_followup_at,
  });
}
